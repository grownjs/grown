homegrown = require('..')

$ = module.exports = ->
  delete $[k] for k in $

  Homegrown = homegrown()

  $.server = Homegrown.new()
  $.server.use Homegrown.plugs.test()

  null
