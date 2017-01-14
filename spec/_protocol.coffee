Homegrown = require('..')

$ = module.exports = ->
  delete $[k] for k in $

  $.server = Homegrown.new()
  $.server.use Homegrown.plugs.test()

  null
