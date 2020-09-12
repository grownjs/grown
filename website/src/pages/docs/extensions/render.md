---
title: Render
$render: ../../../lib/layouts/default.pug
runkit:
  endpoint: true
  preamble: |
    const fs = require('fs');
    const path = require('path');
    fs.mkdirSync('./app');
    fs.mkdirSync('./app/views');
    fs.mkdirSync('./app/views/Home');
    fs.mkdirSync('./app/views/About');
    fs.mkdirSync('./app/views/Errors');
    fs.writeFileSync('./app/views/default.js', `
      module.exports = data => '<html><body>' + data.contents + '</body></html>';
    `);
    fs.writeFileSync('./app/views/Home/index.js', `
      module.exports = (_, h) => h('h1', null, 'It works!');
    `);
    fs.writeFileSync('./app/views/About/about.js', `
      module.exports = () => '<h1>About...</h1>';
    `);
    fs.writeFileSync('./app/views/Errors/not_found.js', `
      module.exports = () => '<h1>404</h1>';
    `);
    const Grown = require('@grown/bud')();
    Grown.use(require('@grown/server'));
    const server = new Grown();
    process.nextTick(() => server.listen(8080));
    eval(`__dirname='${path.join(process.cwd(), 'app')}';`);
---

Print out your views and templates as response.

```js
/* @runkit */
// register extension
Grown.use(require('@grown/render'));

// ./views/default.js
// module.exports = data =>
//   `<html><body>${data.contents}</body></html>`;

// ./views/Home/index.js
// module.exports = (_, h) => h('h1', null, 'It works!');

// ./views/About/about.js
// module.exports = () => '<h1>About...</h1>';

// ./views/Errors/not_found.js
// module.exports = () => '<h1>404</h1>';

// setup middleware...
server.plug(Grown.Render({
  template: 'default',
  view_folders: [
    `${__dirname}/views`
  ],
}));

server.mount(ctx => {
  // you can append/prepende to the head and body tags
  ctx.append('head', () => `<title>URL: ${ctx.req.url}</title>`);
  ctx.append('head', () => '<style>*{margin:0}</style>');

  if (ctx.req.url === '/') {
    ctx.render('Home/index');
  } else if (ctx.req.url === '/about') {
    ctx.render('About/about');
  } else {
    ctx.render('Errors/not_found');
  }
});
```

> Click <kbd>► RUN</kbd> and try these links: [`Home`](/), [`About`](/about) and [`Not found`](/not_found).

<div id="target"></div>

## Views

### Props <var>mixin</var>
### Methods <var>mixin</var>

### Public props <var>static</var>
### Public methods <var>static</var>

### Private* props <var>static</var>
### Private* methods <var>static</var>

## Layout

### Props <var>mixin</var>
### Methods <var>mixin</var>

### Public props <var>static</var>
### Public methods <var>static</var>

### Private* props <var>static</var>
### Private* methods <var>static</var>

## Actions

### Props <var>mixin</var>
### Methods <var>mixin</var>

### Public props <var>static</var>
### Public methods <var>static</var>

### Private* props <var>static</var>
### Private* methods <var>static</var>
