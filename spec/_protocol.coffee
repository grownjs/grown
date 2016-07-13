$ = module.exports = ->
  Object.keys($).forEach (k) ->
    delete $[k]

  $.server = require('..')()
  $.client = require('../test')($.server)
  $.server.protocols.test = $.client.protocol()
