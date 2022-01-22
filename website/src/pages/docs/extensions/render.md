---
title: Render
next:
  label: Extensions &rangle; REPL
  link: docs/extensions/repl
$render: ~/src/lib/layouts/default.pug
runkit:
  endpoint: true
  preamble: !include ~/src/lib/shared/chunks/render.js
---

Print out your views and templates as response.

```js
// register extension
Grown.use(require('@grown/render'));

// ./views/default.js
// module.exports = data =>
//   h('html', null, h('body', null, data.contents));

// ./views/Home/index.js
// module.exports = (_, h) => h('h1', null, 'It works!');

// ./views/About/about.js
// module.exports = () => '<h1>About...</h1>';

// ./views/Errors/not_found.js
// module.exports = () => '<h1>404</h1>';

// setup middleware...
server.plug(Grown.Render({
  default_layout: 'default',
  view_folders: [
    `${__dirname}/views`
  ],
}));

server.mount(ctx => {
  // you can append/prepend to the head and body tags
  ctx.append('head', () => `<title>URL: ${ctx.req.url}</title>`);
  ctx.append('head', () => '<style>*{margin:0}</style>');

  if (ctx.req.url === '/') {
    return ctx.render('Home/index');
  }
  if (ctx.req.url === '/about') {
    return ctx.render('About/about');
  }
  return ctx.render('Errors/not_found');
});
```

> Click <kbd>▷ RUN</kbd> and try these links: [`Home`](/), [`About`](/about) and [`Not found`](/not_found).

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
