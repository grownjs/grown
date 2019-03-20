---
title: Command line
$render: ../../_/layouts/default.pug
---

Make sure you write a script like the shown below, e.g. **your-app/application.js**

```js
// require and create a Grown-container
const Grown = require('grown')();

// exports for external usage
const initServer = module.exports = () => {
  // create the web-server instance
  const server = new Grown();

  // return the server to be called later
  return server;
};

// e.g. `node ./your-app/application.js`
if (require.main === module) {
  initServer()
    .listen(Grown.argv.flags.port || 8080)
    .catch(e => {
      console.log('E_FATAL', e);
      process.exit(1);
    });
}
```

> Now you can start the server manually, or use the `CLI` extension...

Get `@grown/cli` globally to run your application:

```bash
$ npm install -g @grown/cli
$ cd your-app
$ grown up
```

Try `grown --help` to get more usage info.

---

➯ Next: [Add-ons &rangle; Extensions](./docs/extensions)
