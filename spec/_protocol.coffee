homegrown = require('..')
test = require('../lib/test')

$ = module.exports = ->
  delete $[k] for k in $

  Homegrown = homegrown()

  $.server = Homegrown.new()
  $.server.fetch = test($.server)

  null
