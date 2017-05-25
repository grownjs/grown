---
title: FTW
$render: ../../_layouts/default.pug
---

### Models

Simple and well-known data structures that just works.

#### JSON-Schema

At least declaring a `$schema` will be enough.

```js
// app/models/Dummy.js

module.exports = {
  $schema: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    required: [
      'id',
    ],
  },
},
```

&mdash; References:

- [json-schema-sequelizer](https://www.npmjs.com/package/json-schema-sequelizer)
- [json-schema-faker](https://github.com/json-schema-faker/json-schema-faker)
- [sequelize](http://docs.sequelizejs.com/)


#### Model syncing

To synchronize your database execute `grown db-sync` on your terminal.

> If the changes are not applied try again with the `--force` flag

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

#### Interactive mode (models)

Within the REPL you can run `.models` to inspect them.

Models are available within the REPL, so `Dummy` will be a local.

- [back](/)
- [next](/docs/views)
