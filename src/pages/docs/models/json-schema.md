---
title: FTW
$render: ../../../_layouts/default.pug
---

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
