$ = module.exports = ->
  Object.keys($).forEach (k) ->
    delete $[k]

  $.server = require('..').new()
  $.client = require('../test')($.server)
  $.server.protocols.test = $.client.protocol()
