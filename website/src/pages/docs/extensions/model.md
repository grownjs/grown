---
title: Model
$render: ~/src/lib/layouts/default.pug
runkit:
  preamble: !include ~/src/lib/shared/chunks/model.js
---

Declare and validate your models using JSON-Schema definitions.


```js
/* @runkit */
// register extension
const Model = Grown.use(require('@grown/model'));

// declares a single entity model
const Example = Model.Entity.define('Test', {
  $schema: {
    id: 'TestExample',
    type: 'object',
    properties: {
      value: {
        type: 'string',
      },
    },
  },
});

// connect database for this model only
const ExampleModel = await Example.connect({
  dialect: 'sqlite',
  storage: ':memory:',
});

// direct access to your sequelize-models
await ExampleModel.sync();
await ExampleModel.count();
```

Repositories are built by scanning source files in any given directory, e.g.

```js
/* @runkit */
// register extension
const Model = Grown.use(require('@grown/model'));

// ./models/Test/index.js
// module.exports = {
//   $schema: require('./schema')
// };

// ./models/Test/schema.json
// {
//   "id": "TestModel",
//   "type": "object",
//   "properties": {
//     "value": {
//       "type": "string"
//     }
//   }
// }

// scan for all model definitions within
const repo = Grown.Model.DB.bundle({
  models: `${__dirname}/models`,
  database: {
    identifier: 'test',
    config: {
      dialect: 'sqlite',
      storage: ':memory:'
    }
  }
});

// expose RESTful endpoint to your models
const API = Grown.Model.Formator({
  database: Grown.Model.DB.test,
  prefix: '/db',
});

// connect the repository
await repo.connect();
await repo.sync();

// access model as a RESTful resource
const TestRepo = API.from(repo.models.ExampleModel);
const testCount = await TestRepo.count();

console.log(testCount);

// close connection
await repo.disconnect();
```

In the example above we're using `API` as our RESTful adapter, we can also `plug()` it in our server application, e.g. `server.plug(API)` &mdash; that would mount the `/db` endpoint.

> Repos are built using [`sastre`](https://github.com/tacoss/sastre) &mdash; check it out for further info.

## CLI

### Public methods <var>static</var>

- `usage(bin)` &mdash; Prints out the usage info for the given binary.
- `execute(db, cmd, argv)` &mdash; Run the given `cmd` and `argv` through the given `db` connection.

> See [json-schema-sequelizer](https://github.com/json-schema-faker/json-schema-sequelizer) for usage info.

## DB

### Public methods <var>static</var>

- `registered(name)` &mdash; Returns `true` if the named connection is already defined.
- `register(name, params)` &mdash; Add a named connection to the registry where params is an object with `config`, `refs` and `cwd` options.
- `bundle(options)` &mdash; Returns a repository built on top of given `models` directory and `database` options as connection.

> Repos has the following methods/props: `disconnect()`, `connect()`, `sync()`, `get(model)`, `connection`, `sequelize`, `schemas`, `models` and `$refs`.

### Private* props <var>static</var>

- `_registry` &mdash; All registered database connections.

## Entity

### Public methods <var>static</var>

- `define(name, params)` &mdash; Returns a new `Entity` model from the given `name` and `params` arguments.
- `connect(options[, refs, cwd])` &mdash; Set the connection for the given options; `refs` and `cwd` are for dereferencing.
- `getSchema(id[, refs])` &mdash; Returns the wrapped schema, given `id` is lookup through `definitions` schemas; `refs` are optional schemas.

### Private* methods <var>static</var>

- `_validateFrom(id, ref, refs, data)` &mdash; Returns a promise with the validation results from calling `_assertFrom(...)`.
- `_assertFrom(id, ref, refs, data)` &mdash; Retrieve the named schema by `ìd` and validates the given `data` input; `ref` and `refs` are optional.
- `_fakeFrom(id, refs, opts)` &mdash; Generates examples based on the json-schema found by `id`-
- `_through(id, refs)` &mdash; Used to resolve from `definitions` returning the same methods as `_schema(...)`.
- `_schema(id, refs)` &mdash; Used to resove from regular schemas; returns `fakeOne`, `fakeMany`, `assert`, and `validate` methods.
- `_wrap(id, def[, refs])` &mdash; Use to decorate any given model with the `getSchema(...)` method, only if is not present already.

> See [json-schema-faker](https://json-schema-faker.js.org/) for usage info.

## Formator

### Public methods <var>static</var>

- `$install(ctx)` &mdash; Auto-mount endpoint for general usage; requires `prefix`, `database` and `options` to be defined.
- `from(Model, params, options)` &mdash; Returns a RESTful resource for the given model; requires `database` to be defined.

> RESTful resources have six methods only: `findAll`, `findOne`, `destroy`, `update`, `count` and `create`.
>
> See [formator](https://github.com/pateketrueke/formator) for usage info.

---

➯ Next: [Extensions &rangle; Render](./docs/extensions/render)
