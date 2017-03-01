Grown = require('..')
test = require('../lib/test')

$ = module.exports = ->
  delete $[k] for k in $

  $.server = new Grown()
  $.server.fetch = test($.server)

  $.close = ->
    Grown.burn()

  null

$.close = ->
  Grown.burn()
