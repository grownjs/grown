---
title: Installation
$render: lib/layouts/default.pug
runkit:
  endpoint: true
  preamble: |
    require('@grown/bud');
    require('@grown/server');
---

I suggest you installing NodeJS through NVM, using `8.16.2` or higher is fine.

See: [NVM installation instructions](https://github.com/creationix/nvm#installation)

Once done, install the main `grown` dependency:

```bash
$ npm install grown --save
```

## How it works?

On the beginning, starting a new web server is a simple task:

```js
/* @runkit */
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

> Once you click <kbd>► RUN</kbd> try opening [`this link`](/) in your browser.

<iframe id="target" name="external"></iframe>

---

➯ Next: [APIs &rangle; The interface](./docs)
