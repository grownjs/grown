---
title: The interface
$render: ../_layouts/default.pug
---

# The interface

Our main module is a factory which takes two optional arguments:

```js
// our generated class-and-factory
const Grown = require('@grown/grown')(cwd, argv);
```

If no arguments are given both values will be taken from the current `process`.

## Static props

- `version` &mdash; will return the framework's version
- `argv` &mdash; parsed argv from command-line
- `cwd` &mdash; current working directory
- `env` &mdash; current `process.env.NODE_ENV`

➯ Next: [Command line](./docs/command-line)

---

## Static methods

- `module(classpath[, definition])` &mdash; extensions' accesor by classpath
- `use(module)` &mdash; register third-party extensions

➯ Next: [Extensions](./docs/extensions)

---

## Constructor

`Grown` is a _class-and-factory_ function which can define and access several
extensions within its own context:

```js
// declare an extension with module()
Grown.module('Application', {
  name: 'Example',
});

// access the extension directly
console.log(Grown.Application.name);
```

See: [`object-new` definitions](https://www.npmjs.com/package/object-new#definitions)

---

## Server instances

Our interface can create any amount of server instances by using the `new` operator or method:

```js
// both calls are equivalent
const server1 = new Grown();
const server2 = Grown.new();
```

Servers can take options during instantiation:

```js
const server = Grown.new({
  foo: 'bar',
  baz: {
    buzz: 'bazzinga',
  },
});
```

Those options are only accessible within the connection:

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

➯ Next: [Middleware](./docs/middleware)

---

## Instance methods

- `on(e, cb)` &mdash; subscribe to events
- `off(e, cb)` &mdash; unsubscribe from events
- `once(e, cb)` &mdash; subscribe (once) to events
- `emit(e[, ...])` &mdash; broadcast events to listeners
- `run(scope)` &mdash; dispatch a request through the middleware
- `plug(extensions)` &mdash; overload extensions from connection
- `mount(middleware)` &mdash; append middleware to the server instance
- `listen([connection])` &mdash; starts a new web server connection

➯ Next: [Connection](./docs/connection)
