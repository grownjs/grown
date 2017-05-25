---
title: FTW
$render: ../../../_layouts/default.pug
---

#### Pre-compiled templates

How this can be possible may you think?

Support for turning JSX, Pug, EJS, Handlebars, etc. into views is built-in:

```
//- app/views/layouts/default.js.pug

html
  head
    title= pageTitle || 'Untitled'
  body
    != yield
```

In the case of JSX you must pass a second argument for the `h()` helper:

```xml
// app/views/layouts/default.jsx

module.exports = ({ pageTitle, yield }, h) => <html>
  <head>
    <title>${pageTiele || 'Untitled'}</title>
  </head>
  <body>${yield}</body>
</html>;
```
