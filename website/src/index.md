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

I suggest you installing NodeJS through NVM, using `10.24` or higher is fine.

See: [NVM installation instructions](https://github.com/creationix/nvm#installation)

Once done, install the main `grown` dependency:

```bash
$ npm install grown --save
```

## How it works?

On the beginning, starting a new web server is a simple task:

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

> Once you click <kbd>► RUN</kbd> try opening [`this link`](/) in your browser.

<div id="target"></div>
