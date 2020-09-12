---
title: Server
$render: ~/src/lib/layouts/default.pug
---

When you invoke the `new Grown()` constructor an instance of `Server` is born.

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

## Module

### Props <var>mixin</var>
### Methods <var>mixin</var>

### Public props <var>static</var>
### Public methods <var>static</var>

### Private* props <var>static</var>
### Private* methods <var>static</var>

### Instance methods

- `on(e, cb)` &mdash; subscribe to events
- `off(e, cb)` &mdash; unsubscribe from events
- `once(e, cb)` &mdash; subscribe (once) to events
- `emit(e[, ...])` &mdash; broadcast events to listeners
- `run(scope)` &mdash; dispatch a request through the middleware
- `plug(extensions)` &mdash; extends the server with additional functionality
- `mount(middleware)` &mdash; append middleware to the server instance
- `listen([connection])` &mdash; starts a new web server connection

---

➯ Next: [Extensions &rangle; Session](./docs/extensions/session)
