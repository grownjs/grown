---
title: FTW
$render: ../../../_layouts/default.pug
---

### Templating (views)

&mdash; If you like exotic stuff, try `.jsx`:

```jsx
// app/views/foo/bar.jsx

module.exports = (locals, h) => <div>
  <h1>It works!</h1>
  <p>Hello, ${locals.name}.</p>
</div>;
```

&mdash; If you prefer Pug templates use `.js.pug`:

```pug
//- app/views/foo/bar.js.pug

div
  h1 It works!
  p Hello, #{name}.
```

&mdash; If you want to pre-compile Markdown switch to `.js.md`:

```md
> OSOM!
```

- [back](/)
