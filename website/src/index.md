---
title: Installation
next:
  label: APIs &rangle; The interface
  link: docs
$render: ~/src/lib/layouts/default.pug
runkit:
  endpoint: true
  preamble: !include ~/src/lib/shared/chunks/main.js
---

**Grown** is an container/web-server, it holds a bunch of extensions for you to use.

To begin, make sure you get the main `grown` dependency:

```bash
$ npm install grown --save
```

Then write the following script:

```js
// require and create a Grown-container
const Grown = require('grown')();

// create the web-server instance
const server = new Grown();

// append middleware
server.mount(ctx => {
  ctx.res.write(new Date().toISOString());
  ctx.res.end();
});

// starts the web-server
server.listen(8080);
```

> Click <kbd>▷ RUN</kbd> on the code-block and then open [`this link`](/), it will load below.

<div id="target" data-external></div>

Save the script as `server.js` and execute it right away with `node server`, then open http://localhost:8080 in your browser.

### Highlights

- The `Grown` class/function is the main container, it holds the application modules &mdash; next you'll learn how to extend it.
- The `server` instance holds a minimal web-server implementation compatible with some express-middleware &mdash; it's not perfect but it works.
- The `ctx` object holds a bare `req` and `res` implementations &mdash; by extending the container you can plug additional functionality on the web-server.
