---
title: FTW
$render: ../../../_layouts/default.pug
---

#### Testing views

Render, validate and assert all kind-of views:

```coffee
# spec/views-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'all views', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    data =
      value: 'OSOM'

    partial = @render (locals, h) ->
      h('p', null, locals.value)
    , data

    @render 'layouts/default',
      yield: partial
      routes: @routes

    .then (result) ->
      expect(result).toContain '<!doctype html>'
      expect(result).toContain '<p>OSOM</p>'
      done()
```
