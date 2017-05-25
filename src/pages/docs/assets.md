---
title: FTW
$render: ../../_layouts/default.pug
---

## Asset pipeline

**Tarima** is used for that hard-thing: frontend.

&mdash; Default settings:

```js
{
  // all sources will be relativized from this "cwd"
  "cwd": ".",

  // source files are watched/scanned from here
  "src": [
    "app/views",
    "app/assets"
  ],

  // additional sources to watch for changes
  // on any, dependant sources will be notified
  "watch": [
    "app/server.js",
    "app/models",
    "app/controllers",
    "boot",
    "config",
    ".env",
    "package.json"
  ],

  // source files filtering, e.g.
  // "skip all underscored files/directories"
  "filter": [
    "!_*",
    "!**/_*",
    "!**/_*/**"
  ],

  // only scripts matching this globs are bundled
  "bundle": [
    "**/views/**/*.{md,pug}",
    "**/javascripts/**"
  ],

  // quick renaming patterns as "FROM_GLOB:TO_PATH"
  // /1 and /2 will slice their fullpath, e.g.
  // "app/views/foo/bar.js" => "views/foo/bar.js"
  // "app/assets/stylesheets/foo.css" => "public/stylesheets/foo.css"
  "rename": [
    "**/views/**:{fullpath/1}",
    "**/assets/**:public/{fullpath/2}"
  ],

  // ignore sources from read/watch (globs ala-gitignore)
  // useful in case you don't have "ignoreFiles"
  "ignore": [
    ".DS_Store",
    ".tarima",
    "*.swp",
    ".env"
  ],

  // same as "ignore" but parse ignoreFiles's files and
  // append its values as regular "ignore" globs
  "ignoreFiles": [
    ".gitignore"
  ],

  // general-purpose plugins:
  // talavera is used for building images and sprites
  "plugins": [
    "talavera"
  ],

  // development-only plugins:
  // tarima-lr provides live-reload integration
  "devPlugins": [
    "tarima-lr"
  ],

  // automatic source prefixing, e.g. "foo.js" => "foo.es6.js"
  "extensions": {
    "js": "es6",
    "css": "less"
  },

  // custom settings for plugins
  "pluginOptions": {
    "talavera": {
      "dest": "public/images",
      "public": "build/public"
    }
  },

  // custom settings for bundling
  "bundleOptions": {
    "rollup": {
      "format": "iife",
      "plugins": [
        "rollup-plugin-node-resolve",
        "rollup-plugin-commonjs"
      ],
      "rollup-plugin-node-resolve": {
        "module": true,
        "jsnext": true,
        "main": true,
        "browser": true
      }
    }
  }
}
```

### Static files

Any supported file that is not processed (see below) is just copied.

&mdash; If you need to render a static file just add a supported extension:

```text
User-agent: *
Allow: <%= env.SITE_ROOT %>
```

Source file `app/assets/robots.txt.ejs` is rendered to `public/robots.txt` dest.

> Make sure you install `yarn add ejs --dev` or `npm i ejs --save-dev` for `.ejs` files

&mdash; If you need markup to be generated from templates use `.pug` instead:

```jade
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

### Javascripts

Bundle from [supported sources](https://github.com/tacoss/tarima#20---supported-engines): CoffeeScript, TypeScript, Svelte, Vue, etc.

&mdash; Just rename your source files for custom support:

```jade
//- app/assets/javascripts/_components/example.vue.pug

template
  h1 It works!

script.
  export default {
    mounted() {
      console.log('OSOM!');
    },
  };
```

&mdash; The source is not rendered (see [filter](#asset-pipeline)), but can be loaded by an entry-point:

```js
// app/assets/javascripts/welcome.js

import Example from './_components/example.vue.pug';

new Example({
  el: '#app',
});
```

&mdash; If you need ES6 async/await support:

- install `nodent` in your project
- add `"nodent": true` to your `bundleOptions`

&mdash; Known issues:

- using `async/await` within JSX simply won't work

### Stylesheets

&mdash; Same as `.js` files but for LESS, Sass, PostCSS or Styl:

```css
/* app/assets/stylesheets/example.post.css */

::root {
  --color: red;
}

.error {
  color: var(--color);
}
```

Source file is saved to `public/stylesheets/example.css` dest.

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

```pug
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
