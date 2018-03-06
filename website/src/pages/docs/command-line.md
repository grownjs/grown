---
title: Command line
$render: ../../_layouts/default.pug
---

There's no need to start the server manually, it'll be handled by the `CLI` extension.

First, make sure you write a script like this:

**your-app/application.js**

```js
// require and create a Grown-container
const Grown = require('grown')();

module.exports = () => {
  // create the web-server instance
  const server = new Grown();

  return server;
};
```

Get `@grown/cli` globally to run your application:

```bash
$ npm install -g @grown/cli
$ cd your-app
$ grown up
```

Try `grown --help` to get more usage info.

➯ Next: [Extensions](./docs/extensions)
