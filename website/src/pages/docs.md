---
title: The interface
$render: ../_/layouts/default.pug
---

Our main module is a factory which takes two optional arguments:

```js
const cwd = process.cwd();
const argv = process.argv.slice(2);

const Grown = require('grown')(cwd, argv);
```

> If no arguments are given both values will be taken from the current `process`

Once created, the `Grown` function behaves like a container, it can be called to
store and retrieve definitions from it.

```js
// register an extension
Grown('Application', {
  name: 'Example',
});

// both calls are equivalent
console.log(Grown.Application.name);
console.log(Grown('Application.name'));
```

See: [`object-new` definitions](https://www.npmjs.com/package/object-new#definitions)

---

### Static props

- `version` &mdash; will return the framework's version
- `argv` &mdash; parsed argv from command-line
- `cwd` &mdash; current working directory
- `env` &mdash; current `process.env.NODE_ENV`

➯ Next: [Command line](./docs/command-line)

---

### Static methods

- `do(body)` &mdash; wraps code into promises
- `use(module)` &mdash; register custom extensions
- `new([options])` &mdash; shortcut for `new Grown(...)`
- `load(cwd[, suffix])` &mdash; allow to collect extensions

➯ Next: [Extensions](./docs/extensions)

---

## The instance

When you invoke the `Grown` constructor a new `Server` instance is created, e.g.

```js
const server = new Grown({
  foo: 'bar',
  baz: {
    buzz: 'bazzinga',
  },
});
```

Received options are accessible only within the connection:

```js
server.mount((ctx, options) => {
  console.log(options('foo')); // bar
  console.log(options('baz.buzz')); // bazzinga
});
```

Options can resolve to default values, otherwise they'll throw an error:

```js
// it's fine to have default values
const x = options('some.value', 42);

// but some options should be present!
const y = options('a.required.setting.here');
```

➯ Next: [Connection](./docs/connection)

---

### Instance methods

- `on(e, cb)` &mdash; subscribe to events
- `off(e, cb)` &mdash; unsubscribe from events
- `once(e, cb)` &mdash; subscribe (once) to events
- `emit(e[, ...])` &mdash; broadcast events to listeners
- `run(scope)` &mdash; dispatch a request through the middleware
- `plug(extensions)` &mdash; extends the server with additional functionality
- `mount(middleware)` &mdash; append middleware to the server instance
- `listen([connection])` &mdash; starts a new web server connection

➯ Next: [Middlewares](./docs/middlewares)
