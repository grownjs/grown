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
