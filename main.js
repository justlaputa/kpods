var moment = require('moment')
var columnify = require('columnify')

var Pod = require('./lib/pod')
var Api = require('./lib/api')

var args = process.argv.slice(2)

// default configuration
var Config = {
  'server': 'http://127.0.0.1:8080'
}

function usage() {
  console.log("kpods show deatal information of kubernetes pods")
}

function loadConfig() {
  //TODO load .kube/config from home folder
}


function main() {
  loadConfig()

  let api = new Api(Config.server)

  api.pods().then(podList => {

    let parsedPods = []
    podList.forEach(pod => {
      parsedPods = parsedPods.concat(extractPod(pod, pod.containers))
    })

    console.log(columnify(parsedPods, {
      truncate: true,
      columnSplitter: '   ',
      columns: ['namespace', 'name', 'phase', 'reason', 'age', 'restarts', 'ready', 'mem', 'cpu', 'pod-ip', 'host-ip', 'node'],
      config: {
        'name': { maxWidth: 30 }
      }
    }))
  })
}

function extractPod(pod, containers) {
  if (!containers || containers.length === 0) {
    return [makePodRow(pod, null)]
  }

  let combinedPods = [makePodRow(pod, containers)]

  for (let i = 0; i < containers.length; i++) {
    combinedPods.push(makeContainerRow(pod, containers[i], i === containers.length-1))
  }

  return combinedPods
}

function makePodRow(pod, containers) {
  let combinedPod = {}

  let sumRestarts = (sum, c2) => {
    return sum + c2.restartCounts
  }

  let sumReady = () => {
    let total = containers.length
    let sum = 0
    containers.forEach(c => {
      if (c.ready) sum++
    })

    return `${sum}/${total}`
  }


  if (pod !== null) {
    combinedPod = Object.assign(combinedPod, {
      namespace: pod.namespace,
      name: pod.name,
      phase: pod.phase,
      age: readTime(pod.createTime),
      restarts: containers.reduce(sumRestarts, 0),
      ready: sumReady(),
      'pod-ip': pod.podip,
      'host-ip': pod.hostip,
      node: pod.node
    })
  }

  return combinedPod
}

function makeContainerRow(pod, container, isLast) {
  let combinedPod = {}

  let reqLimit = (resourceType) => {
    let req = container[`${resourceType}Request`] || '-'
    let limit = container[`${resourceType}Limit`] || '-'
    return `${req}/${limit}`
  }

  let addTablePrefix = (str) => {
    return (isLast ? '└─ ' : '├─ ') + str
  }

  if (container !== null) {
    combinedPod = Object.assign(combinedPod, {
      name:  addTablePrefix(container.name),
      phase: addTablePrefix(container.state),
      reason: container.stateReason,
      restarts: addTablePrefix(container.restartCounts),
      age: addTablePrefix(readTime(container.stateStarted)),
      ready: addTablePrefix(container.ready),
      mem: reqLimit('memory'),
      cpu: reqLimit('cpu')
    })
  }

  return combinedPod
}

function readTime(time) {
  return moment(time).fromNow()
}

main()