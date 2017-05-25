---
title: FTW
$render: ../../../_layouts/default.pug
---

### Testing the app

You can leverage on `Grown.test()` for starting and adding hooks.

&mdash; So a typical test-harness may involve no configuration:

```coffee
# spec/app-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'any application', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    # calling `Grown.test(app)` will return a function that:
    # - call `app.teardown()` to stop any previous instance
    # - setup a new `farm` by calling `app()`
    # - call `farm.run()`
    # - attach `farm.extensions` to `this`
    # - start listening at `test://`
    done()

  describe 'all extensions', ->
    it 'can be tested too', (done) ->
      # middleware and plugins can be loaded separatedly
      test = require('../boot/midlewares/test')
      result = null

      # assert or capture before
      @mount (conn) ->
        null

      # mount before using
      @mount test()

      # assert or capture after
      @mount (conn) ->
        result = conn.something_returned_by_middleware_test
        null

      # start requesting
      @server.fetch().then (res) ->
        expect(result).toEqual { foo: 42 }
        done()

      .catch (error) ->
        # capture in case of error
        console.log error
        done()
```

Depending on your needs you can go further.
