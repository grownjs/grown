---
title: Installation
$render: _layouts/default.pug
runkit:
  endpoint: true
---

I suggest you installing NodeJS through NVM, using `v4.8.x` or higher is fine.

See: [NVM installation instructions](https://github.com/creationix/nvm#installation)

Once done, install the main `grown` dependency:

```bash
$ npm install grown --save
```

## How it works

On the beginning, starting a new web server is a simple task:

```js
/* @runkit */
// require and create a Grown-container
const Grown = require('grown')();

// create the web-server instance
const server = new Grown();

// append middleware
server.mount(ctx => {
  ctx.res.end('<pre>It works!</pre>');
});

// starts the web-server
server.listen(8080);
```

Quite simple, right?

➯ Next: [The interface](./docs)
