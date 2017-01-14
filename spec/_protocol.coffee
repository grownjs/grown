Homegrown = require('..')

$ = module.exports = ->
  Object.keys($).forEach (k) ->
    delete $[k]

  $.server = Homegrown.new()
  $.server.use Homegrown.plugs.test()

  null
