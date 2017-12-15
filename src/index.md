---
title: Installation
$render: _layouts/default.pug
---

# Installation

I suggest you installing NodeJS through NVM, using `v4.8.x` or higher is fine.

See: [NVM installation instructions](https://github.com/creationix/nvm#installation)

Once done, install the main `grown` dependency:

```bash
$ npm install @grown/grown
```

## How it works?

If you're beginning, starting a new web server is a common task:

```js
// require and create our web-server interface
const Grown = require('@grown/grown')();

// create a web-server instance
const server = new Grown();

// append middleware
server.mount(ctx => {
  ctx.res.end('<h1>It works!</h1>');
});

// starts the web-server
server.listen(8080);
```

In the code above `Grown` is just a _class-and-factory_ which can receive
different arguments to create, overload or declare extensions.

Nothing glorious but it can do more stuff...

➯ Next: [The interface](./docs)
