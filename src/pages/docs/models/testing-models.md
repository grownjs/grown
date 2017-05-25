---
title: FTW
$render: ../../../_layouts/default.pug
---

#### Testing models

Prove your models without any trouble:

```coffee
# spec/models-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'all models', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    @models.Dummy.findAll().then (result) ->
      expect(result.length).toEqual 0
      done()
```

JSON-Schema allows you to generate random data through the `faked` property:

```js
const result = Dummy.faked.findAll();
```

&mdash; Known issues:

- only `findOne()` and `findAll()` are supported
