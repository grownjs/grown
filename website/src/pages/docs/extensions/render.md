---
title: Render
next:
  label: Extensions &rangle; REPL
  link: docs/extensions/repl
$render: ~/src/lib/layouts/default.pug
runkit: !include ~/src/lib/shared/runkit/server.yml
---

Print out your views and templates as response, i.e. you can use modules:

```js
// register extension
Grown.use(require('@grown/render'));

fixture`./views/default.js
  module.exports = (data, h) =>
    h('html', null, h('body', null, data.contents));
`;

fixture`./views/Home/index.js
  module.exports = (_, h) => h('h1', null, 'It works!');
`;

fixture`./views/About/about.js
  module.exports = () => '<h1>About...</h1>';
`;

fixture`./views/Errors/not_found.js
  module.exports = () => '<h1>404</h1>';
`;

fixture`./views/example.pug
  h1 OSOM
`;

// setup middleware...
server.plug(Grown.Render({
  default_layout: 'default',
  view_folders: [
    __dirname + '/views',
  ],
}));

server.mount(async ctx => {
  // you can append/prepend to the head and body tags
  ctx.append('head', () => `<title>URL: ${ctx.req.url}</title>`);
  ctx.append('head', () => '<style>*{margin:0}</style>');

  // calls to render() will halt and emit before_render
  if (ctx.req.url === '/') return ctx.render('Home/index');
  if (ctx.req.url === '/about') return ctx.render('About/about');

  // calls to template() must be done asynchronously
  if (ctx.req.url === '/osom') {
    const result = await ctx.template('example.pug');

    // calls to partial() will return strings
    const chunk = ctx.partial('Home/index');

    return ctx.res.end(result + chunk);
  }

  return ctx.render('Errors/not_found');
});
```

> Click <kbd>▷ RUN</kbd> above and then try these links ([`Home`](/), [`About`](/about), [`Example`](/osom) and [`Not found`](/not_found)) below.

<div id="target" data-external></div>

---

## Views

### Methods <var>mixin</var>

- `render(src[, data])` &mdash;
- `partial(src[, data])` &mdash;
- `template(src[, data])` &mdash;

### Public props <var>static</var>

- `view_folders` &mdash;

### Public methods <var>static</var>

- `render(src[, data])` &mdash;
- `partial(src[, data])` &mdash;
- `template(src[, data])` &mdash;
- `$install(ctx, scope)` &mdash;
- `$mixins()` &mdash;

### Private* props <var>static</var>

- `_cache` &mdash;

### Private* methods <var>static</var>

- `_buildPartial(view, data)` &mdash;
- `_buildvNode(tag, data)` &mdash;
- `_buildHTML(vnode, depth, context)` &mdash;
- `_buildAttr(key, value)` &mdash;
- `_buildCSS(style)` &mdash;
- `_partial(view, cached, options)` &mdash;
- `_render(fn, data)` &mdash;

---

## Layout

### Props <var>mixin</var>

- `chunks` &mdash;

### Methods <var>mixin</var>

- `prepend(to, opts)` &mdash;
- `append(to, opts)` &mdash;

### Public props <var>static</var>

- `default_layout` &mdash;

### Public methods <var>static</var>

- `$before_render` &mdash;
- `$install()` &mdash;
- `$mixins()` &mdash;

### Private* methods <var>static</var>

- `_renderSlot(opts, state)` &mdash;

---

## Actions

### Public methods <var>static</var>

- `$install(ctx)` &mdash;
