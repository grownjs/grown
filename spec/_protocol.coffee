Homegrown = require('..')

$ = module.exports = ->
  Object.keys($).forEach (k) ->
    delete $[k]

  $.server = Homegrown.new()
  $.server.ctx.use Homegrown.plugs.test()

  null
