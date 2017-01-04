Homegrown = require('..')

$ = module.exports = ->
  Object.keys($).forEach (k) ->
    delete $[k]

  $.server = Homegrown.new()
  $.client = Homegrown.plugs.test($.server)
  $.server.protocols.test = $.client.protocol()
