---
title: FTW
$render: ../../../_layouts/default.pug
---

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
