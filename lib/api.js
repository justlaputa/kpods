// api.js
// wraps kubernetes apiserver rest api

var fetch = require('node-fetch')
var Pod = require('./pod')

module.exports = class {
  constructor(server) {
    this.server = server
    this.endpoint = `${server}/api/v1`
  }

  pods() {
    let apiUrl = this.endpoint + '/pods'

    return fetch(apiUrl)
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        throw new Error(res.statusText)
      }).then(json => {
        let podList = []

        json['items'].forEach(item => {
          podList.push(new Pod(item))
        })

        return podList
      }).catch(error => {
        console.log(error)
      })
  }
}
