---
title: Render
$render: ../../../lib/layouts/default.pug
runkit:
  endpoint: true
  preamble: |
    const fs = require('fs');
    fs.mkdirSync('./views');
    fs.mkdirSync('./views/Home');
    fs.writeFileSync('./views/Home/index.js', `
      module.exports = () => '<h1>It works!</h1>';
    `);
    const Grown = require('@grown/bud')();
    Grown.use(require('@grown/server'));
    const server = new Grown();
    process.nextTick(() => server.listen(8080));
---

```js
/* @runkit */
// register extension
Grown.use(require('@grown/render'));

// setup...
server.plug(Grown.Render({
  view_folders: [
    `${__dirname}/views`
  ],
}));

server.mount(ctx => {
  try {
    ctx.render('Home/index');
  } catch (e) {
    ctx.res.write(e.message);
    ctx.res.end();
  }
});
```

> Try ... [`this link`](/).

<iframe id="target" name="external"></iframe>

➯ Next: [Extensions &rangle; REPL](./docs/extensions/repl)
