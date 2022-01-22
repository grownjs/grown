---
title: Command line
next:
  label: Add-ons &rangle; Extensions
  link: docs/extensions
$render: ~/src/lib/layouts/default.pug
---

Make sure you write a script like the shown below, e.g. `app.js`

```js
// require and create a Grown-container
const Grown = require('grown')();

// create the web-server instance
const server = new Grown();

// exports the server to be used later
module.exports = server;

// starts if required directly by node
if (require.main === module) {
  server.listen(Grown.argv.flags.port || 8080);
}
```

> Run your server manually with `node app` or with `npx grown server start` &mdash; the latter will check for any `{app,main,index,server}.js` script.

Try `npx grown --help` to get more usage info, also in sub commands like `npx grown generate def --help` and so on.

> Also, you can setup a `bin/grown` executable with the following content:
>
> ```bash
> #!/usr/bin/env node
> require('grown/cli.js');
> ```
>
> Test it out!

### Highlights

- The application script can be named as `app.js`, `main.js`, `index.js` or `server.js` &mdash; otherwise, it should be specified by the `--app` option.
- The application script can be invoked by the `grown` binary if the server gets exported &mdash; it can be executed by `node` using the `require.main` check.
