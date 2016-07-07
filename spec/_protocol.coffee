$ = module.exports = ->
  $.server = require('..')()
  $.client = require('../test')($.server)
  $.server.protocols.test = $.client.protocol()
