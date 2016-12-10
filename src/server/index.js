var http = require('http')
var express = require('express')
var config = require('../config')

main()

function main () {
  var httpServer = http.createServer()

  var app = express()
  app.use(express.static('build'))
  httpServer.on('request', app)

  httpServer.listen(config.SERVER.PORT, function () {
    console.log('Listening on ' + JSON.stringify(httpServer.address()))
  })
}
