---
title: FTW
$render: ../../../_layouts/default.pug
---

### Images & Sprites

**Talavera** will handle all found images and sprites within our sources.

&mdash; Files matching `**/images/**/*.{png,jpg,jpeg}`:

- are copied to `public/images`
- are referenced on `public/images/images.css`

&mdash; Files matching `**/sprites/**/*.{png,svg}`:

- are bundled to `public/images/sprites.svg` (`.svg` sources only)
- are bundled to `public/images/sprites.png` (`.png` files only)
- are referenced on `public/images/sprites.css` (`.png` files only)

&mdash; Exported sources are grouped by their immediate dirname:

Given `app/assets/sprites/foo/bar.png` the generated files are:

- `public/images/foo.css`
- `public/images/foo.png`
- `public/images/foo.svg`

&mdash; Exported sources can be rendered using a shared view or partial:

```
//- app/views/shared/icons.pug

<@includeTag "images/sprites.css">
<@destFile "public/images/sprites.svg">
<@image "salads">
<@icon "npm">
<@svg "agenda">
```

Then call `view()` to render the previous fragment:

```js
conn.view('shared/icons.html', { as: 'resources' });
```

It will create a `resources` local available on the layout.

> This feature is available only during compilation and just for markup sources
