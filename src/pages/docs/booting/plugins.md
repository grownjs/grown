---
title: FTW
$render: ../../../_layouts/default.pug
---

### Plugins

Self-contained functionality can be plugged-in on your farms.

```js
$.use(ctx => {
  console.log($ === ctx); // true

  // enhance connection
  ctx.util.props({
    foo: Promise.resolve(42),
  })
  .then(result => {
    ctx.extensions.something = result;
  );
});
```

&mdash; Built-in plugs are:

- `Grown.plugs.logger` &rarr; Add logging methods to the connection
- `Grown.plugs.models` &rarr; Support for look-up and loading models
- `Grown.plugs.render` &rarr; Support for views and layouts
- `Grown.plugs.router` &rarr; Support for app-routing
- `Grown.plugs.session` &rarr; Support for session and cookies
- `Grown.plugs.socket` &rarr; Support for SocketIO methods
- `Grown.plugs.testing` &rarr; Testing-wrapper harness
- `Grown.plugs.container` &rarr; Support for IoC/DI
- `Grown.plugs.formidable` &rarr; Support for file uploads

### Extensions

Plugins can and usually do enhance the `$.extensions` property.

&mdash; All those values are attached to the connection instance:

```js
$.mount(conn => {
  console.log(conn.something); // { foo: 42 }
});
```
