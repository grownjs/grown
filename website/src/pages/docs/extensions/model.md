---
title: Model
$render: ../../../lib/layouts/default.pug
runkit:
  preamble: |
    const Grown = require('@grown/bud')();
    Grown.use(require('@grown/server'));
    const server = new Grown();
---

...


```js
/* @runkit */
// register extension
const Model = Grown.use(require('@grown/model'));

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

Example.connect({
  dialect: 'sqlite',
  storage: ':memory:',
}).then(Model => {
  return Model;
});
```

## CLI

### Public props <var>static</var>

- `usage(bin)` &mdash; Prints out the usage info for the given binary.
- `execute(db, cmd, argv)` &mdash; Run the given `cmd` and `argv` through the given `db` connection.

> See [json-schema-sequelizer](https://github.com/json-schema-faker/json-schema-sequelizer) for usage info.

## Repo

### Public methods <var>static</var>

- `$install(ctx)` &mdash; Auto-mount endpoint for general usage; requires `prefix`, `database` and `options` to be defined.
- `bind(Model, params, options)` &mdash; Returns a single mount-point for the given model; requires `database` to be defined.

## DB

### Private* props <var>static</var>

- `_registry` &mdash; All registered database connections.

### Public methods <var>static</var>

- `registered(name)` &mdash; Returns `true` if the named connection is already defined.
- `register(name, params)` &mdash; Add a named connection to the registry where params is an object with `config`, `refs` and `cwd` options.
- `bundle(options)` &mdash; Returns a repository built on top of given `models` directory and `database` options as connection.

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

---

➯ Next: [Extensions &rangle; Parsers](./docs/extensions/parsers)
