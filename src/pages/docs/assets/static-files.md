---
title: FTW
$render: ../../../_layouts/default.pug
---

### Static files

Any supported file that is not processed (see below) is just copied.

&mdash; If you need to render a static file just add a supported extension:

```
User-agent: *
Allow: <%= env.SITE_ROOT %>
```

Source file `app/assets/robots.txt.ejs` is rendered to `public/robots.txt` dest.

> Make sure you install `yarn add ejs --dev` or `npm i ejs --save-dev` for `.ejs` files

&mdash; If you need markup to be generated from templates use `.pug` instead:

```
doctype html
html
  head
    title Welcome to #{section.title}!
  body
    != yield || section.body
```

Source file `app/assets/welcome.pug` is rendered to `public/welcome.html` dest.

&mdash; If you prefer Markdown try using `.md` for having more fun:

```markdown
# About us
```

Source file `app/assets/about.md` is rendered to `public/about.html` dest.
