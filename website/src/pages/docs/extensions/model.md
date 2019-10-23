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

console.log(Model)
```

## Resource

### Public methods <var>static</var>

- `$install(ctx)` &mdash;
- `dispatch(resource)` &mdash;

### Private* methods <var>static</var>

- `_buildAttachments(Model, options)` &mdash;
- `_buildResource(Model, conn, options)` &mdash;
- `_findModel(resource)` &mdash;

## Loader

### Public methods <var>static</var>

- `scan(cwd[, refs])` &mdash;
- `refs(cwd)` &mdash;

## Repo

### Public methods <var>static</var>

- `sync(opts)` &mdash;
- `clear(opts)` &mdash;
- `connect()` &mdash;
- `disconnect()` &mdash;

### Private* methods <var>static</var>

- `_getSchemas()` &mdash;
- `_getModels()` &mdash;
- `_getModel(name, refs, cwd)` &mdash;
- `_getDB([identifier])` &mdash;

## Base

### Public props <var>static</var>
### Public methods <var>static</var>

### Private* props <var>static</var>
### Private* methods <var>static</var>

## DB

### Public props <var>static</var>
### Public methods <var>static</var>

### Private* props <var>static</var>
### Private* methods <var>static</var>

---

➯ Next: [Extensions &rangle; Parsers](./docs/extensions/parsers)
