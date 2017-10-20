module.exports = class Pod {
  constructor(pod) {
    this.pod = pod
  }

  get name() {
    return this.pod.metadata.name
  }

  get namespace() {
    return this.pod.metadata.namespace
  }

  get createTime() {
    return new Date(this.pod.metadata.creationTimestamp)
  }

  get phase() {
    return this.pod.status.phase
  }

  get conditions() {
    return this.pod.status.conditions
  }

  get containers() {
    return this._parseContainers()
  }

  get podip() {
    return this.pod.status.podIP
  }

  get hostip() {
    return this.pod.status.hostIP
  }

  get node() {
    return this.pod.spec.nodeName
  }

  _parseContainers() {
    let containerMap = {}
    let containers = []
    this.pod.spec.containers.forEach(c => {
      containerMap[c.name] = c
    })

    if (this.pod.status.containerStatuses !== undefined) {
      this.pod.status.containerStatuses.forEach(cs => {
        if (containerMap[cs.name] === undefined) {
          console.warn('container does not exist but container status appeared: %s', cs.name)
          return true
        }
        containerMap[cs.name].status = cs        
      })
    } else {
      for (let cname in containerMap) {
        containerMap[cname].status = null
      }
    }

    for (let name in containerMap) {
      let originalContainer = containerMap[name]

      let container = {
        name: originalContainer.name,
        image: originalContainer.image,
        memoryRequest: originalContainer.resources && originalContainer.resources.requests && originalContainer.resources.requests.memory || '0'
      }

      if (originalContainer.status !== null) {
        container = Object.assign(container, {
          state: Object.keys(originalContainer.status.state)[0],
          stateReason: stateInfo(originalContainer.status.state, 'reason'),
          stateMessage: stateInfo(originalContainer.status.state, 'message'),
          stateStarted: stateInfo(originalContainer.status.state, 'startedAt'),
          stateFinished: stateInfo(originalContainer.status.state, 'finishedAt'),
          ready: originalContainer.status.ready,
          restartCounts: originalContainer.status.restartCount
        })
      }
      containers.push(container)
    }

    function stateInfo(state, info) {
      let stateValue = state[Object.keys(state)[0]]
      return stateValue[info] || null
    }

    return containers
  }
}
