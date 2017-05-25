---
title: FTW
$render: ../../_layouts/default.pug
---

### Views

Responses are in their most beauty.

#### Functions as templates

Views are plain-old functions that receive data:

```js
// app/views/layouts/default.js

module.exports = locals => `<html>
  <head>
    <title>${locals.pageTiele || 'Untitled'}</title>
  </head>
  <body>${locals.yield}</body>
</html>`;
```

Values to render are mostly strings but they can be buffers or streams:

```js
const fs = require('fs');

module.exports = locals =>
  fs.createReadStream(locals.filePath);

// or
module.exports = locals => new Buffer('42');
```

Regular objects are rendered as JSON responses:

```js
module.exports = locals => ({
  status: 'ok',
  data: locals.userInput,
});
```

Promised values are resolved before they get finally rendered.

#### Pre-compiled templates

How this can be possible may you think?

Support for turning JSX, Pug, EJS, Handlebars, etc. into views is built-in:

```jade
//- app/views/layouts/default.js.pug

html
  head
    title= pageTitle || 'Untitled'
  body
    != yield
```

In the case of JSX you must pass a second argument for the `h()` helper:

```jsx
// app/views/layouts/default.jsx

module.exports = ({ pageTitle, yield }, h) => <html>
  <head>
    <title>${pageTiele || 'Untitled'}</title>
  </head>
  <body>${yield}</body>
</html>;
```

#### Layouts & blocks

This can be changed through `locals`, `conn.layout` or from any controller:

```js
// app/controllers/Home.js

module.exports = {
  layout: 'website',
  methods: {
    index(conn) {
      // conn.layout = false;
      // conn.put_local('layout', false);
      // return conn.render('pages/welcome', { layout: false });
    },
  },
};
```

Also you can set `layout` functions to render:

```js
{
  layout: (locals, h) => (
    locals.isDebug
      ? h('pre', null, JSON.stringify(locals, null, 2))
      : locals.yield
  ),
}
```

Lazy-views are created the same way as regular views and render functions:

```js
conn.view('pages/first-chunk', { as: 'main' });
conn.view('pages/second-chunk', { as: 'sidebar' });
conn.view('pages/third-and-last', { as: 'sidebar' });
```

Chunks are grouped by using the same `as` local, once rendered they are arrays:

```js
locals => `<div>
  <aside>${locals.sidebar.join('\n')}</aside>
  <main>${locals.main}</main>
</div>`;
```

Wisely use `Array.isArray()` to check your locals for avoiding unexpected results.

#### Testing views

Render, validate and assert all kind-of views:

```coffee
# spec/views-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'all views', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    data =
      value: 'OSOM'

    partial = @render (locals, h) ->
      h('p', null, locals.value)
    , data

    @render 'layouts/default',
      yield: partial
      routes: @routes

    .then (result) ->
      expect(result).toContain '<!doctype html>'
      expect(result).toContain '<p>OSOM</p>'
      done()
```

#### Interactive mode (render)

The `.render` command help you to achieve similar results.

Examples:

```bash
.render layouts/default
.render Home/index
```

Locals declared on `before_send()` filters are not available on the REPL or `@render` method.

- [back](/)
- [next](/docs/booting)
