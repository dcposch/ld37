var http = require('http')
var express = require('express')
var compress = require('compression')

var config = require('../config')

main()

function main () {
  var httpServer = http.createServer()

  var app = express()
  app.use(compress())
  app.use(express.static('build'))
  app.use(express.static('static'))
  httpServer.on('request', app)

  httpServer.listen(process.argv[2] || config.SERVER.PORT, function () {
    console.log('Listening on ' + JSON.stringify(httpServer.address()))
  })
}
