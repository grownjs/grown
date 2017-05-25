---
title: FTW
$render: ../../../_layouts/default.pug
---

### Middlewares

Functions that can manipulate the connection details.

```js
$.mount(conn => {
  console.log('Before all middleware is run');

  return conn.next(() => {
    console.log('After all middleware was run');
  });
});
```

&mdash; Express-middleware can be mounted too:

```js
$.mount(require('serve-static')(__dirname));
```
