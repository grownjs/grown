# Grown

[![travis-ci](https://api.travis-ci.org/pateketrueke/grown.svg)](https://travis-ci.org/pateketrueke/grown) [![codecov](https://codecov.io/gh/pateketrueke/grown/branch/master/graph/badge.svg)](https://codecov.io/gh/pateketrueke/grown)

Experimental DSL for web applications

```bash
$ yarn global add grown # or `npm i -g grown`
```

Quick example:

```bash
$ mkdir example
$ cd example
$ grown new .
```

Start the application in `development`:

```bash
$ yarn watch # or `npm run watch`
```

## Table of contents

* [Overview](#overview)
  * [Interactive mode](#interactive-mode)
  * [Controllers](#controllers)
     * [Routing](#routing)
     * [Definition](#definition)
     * [End responses](#end-responses)
     * [Testing actions](#testing-actions)
     * [Interactive mode (fetch)](#interactive-mode-fetch)
  * [Models](#models)
     * [JSON-Schema](#json-schema)
     * [Model syncing](#model-syncing)
     * [Testing models](#testing-models)
     * [Interactive mode (models)](#interactive-mode-models)
  * [Views](#views)
     * [Functions as templates](#functions-as-templates)
     * [Pre-compiled templates](#pre-compiled-templates)
     * [Layouts and blocks](#layouts-and-blocks)
     * [Testing views](#testing-views)
     * [Interactive mode (render)](#interactive-mode-render)
* [Booting](#booting)
  * [Server](#server)
  * [API](#api)
  * [Hooks](#hooks)
  * [Plugins](#plugins)
  * [Middlewares](#middlewares)
  * [Testing the app](#testing-the-app)
  * [Interactive mode (reload)](#interactive-mode-reload)
* [Asset pipeline](#asset-pipeline)
  * [Images](#images)
  * [Static files](#static-files)
  * [Javascripts](#javascripts)
  * [Stylesheets](#stylesheets)
  * [Templating (views)](#templating-views)

### More settings

Run `grown new -y` to start a new project interactively.

Also, you can specify each preset manually on the command line, e.g.

```bash
$ grown new . ES6=traceur BUNDLER=rollup STYLES=less DATABASE=sqlite
```

### Known issues

- `Cannot find module 'talavera'`

  Run `yarn` or `npm i` without arguments again, it will try to reinstall `talavera` for you.


## Overview

**Grown** is a _homegrown_ nodejs framework built on top of open-source technology,
it reuse many patterns from other frameworks and rely on terrific third-party libraries.

In a glance it resembles a well-known directory structure:

```bash
$ tree example
example
├── app
│   ├── server.js
│   ├── assets
│   │   ├── images
│   │   │   └── favicon.ico
│   │   ├── javascripts
│   │   │   └── application.js
│   │   └── stylesheets
│   │       └── application.css
│   ├── controllers
│   │   └── Home.js
│   ├── models
│   │   └── Dummy.js
│   └── views
│       └── layouts
│           └── default.js
├── bin
│   └── server
├── boot
│   ├── initializers
│   │   └── globals.js
│   └── middlewares
│       ├── body-parsers.js
│       ├── csrf-protection.js
│       ├── method-override.js
│       └── no-cache.js
├── build
├── config
│   ├── database.js
│   ├── middlewares.js
│   └── routes.js
├── lib
│   └── tasks
├── log
├── package.json
├── public
│   └── robots.txt
└── tmp
```

### Interactive mode

Execute `grown repl` to start an interactive session.

You can explore the available actions typing `.help` and hitting ENTER.

Most actions responds to the same syntax `arg1 arg2 ... -pq x=y a:b` where:

- `argN` are regular values (can be quoted)
- `-pq` are **flag** values (short or long, as CLI does)
- `x=y` are **data** values (can be quoted, e.g. `x="foo bar"`)
- `a:b` are **param** values (can be quoted, e.g. `a:"foo bar"`)

Try with `.render layouts/default csrf_token="oh noes" yield=OSOM` and see the results.

> Save/load different REPL sessions using the `-i` flag, e.g. `grown repl -i debug`

### Controllers

Routes are the way to go, then you can take control.

#### Routing

Route mappings are defined in the `config/routes.js` file:

```js
module.exports = map =>
  map()
    .get('/', 'Home#index', { as: 'root' });
```

Each time you call a `map()` factory you can pass values and they will be inherited down.

#### Definition

Controllers can be plain-old javascript objects.

```js
// app/controllers/Home.js

module.exports = {
  methods: {
    index() {}
  },
};
```
By the mere fact of being declared, the render plug will try to render a `Home/index` view.

#### End responses

Any method receives the connection object, in turn it can responds or return a string,
buffer, stream or promise:

```js
index(conn) {
  conn.resp_body = '42';
  // return '42';
  // return new Buffer('42');
  // return Promise.resolve('42');
  // return conn.end('42').then(...);
}
```

Call `put_status()` to set a proper status code:

```js
conn.put_status(400);
conn.resp_body = {
  status: 'error',
  message: 'Invalid input',
};
```

#### Testing actions

Doing assertions on your controllers' responses is easy peasy.

```coffee
# spec/pages-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'web pages', ->
  beforeEach Grown.test(app)

  it 'not all pages exists', (done) ->
    @server.fetch('/x').then (resp) ->
      expect(resp.body).toContain('Not Found')
      done()

  it 'but the homepage yes!', (done) ->
    @server.fetch('/').then (resp) ->
      expect(resp.body).toContain('It works!')
      done()
```

Run your tests with `yarn spec` or `npm run spec` and see the results.

#### Interactive mode (fetch)

On the REPL you can `.fetch` resources too.

Examples:

```bash
.fetch POST /account --json username=foo
.fetch destroyAccount
.fetch showLogin
.fetch ...
```

To list all available routes just type `.routes` and hit ENTER.

Try `.routes <something>` to filter out matching routes.

### Models

Simple and well-known data structures that just works.

#### JSON-Schema

At least declaring a `$schema` will be enough.

```js
// app/models/Dummy.js

module.exports = {
  $schema: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
        primaryKey: true,
        autoIncrement: true,
      },
    },
    required: [
      'id',
    ],
  },
},
```

Add more props according the [Sequelize models](http://docs.sequelizejs.com/), e.g.

```js
module.exports = {
  $schema: { ... },
  hooks: { ... },
  scope: { ... },
  ...
}
```

#### Model syncing

To synchronize your database execute `grown db-sync` on your terminal.

#### Testing models

Prove your models without any trouble:

```coffee
# spec/models-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'all models', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    @models.Dummy.findAll().then (result) ->
      expect(result.length).toEqual 0
      done()
```

#### Interactive mode (models)

Within the REPL you can run `.models` to inspect them.

Models are available within the REPL, so `Dummy` will be a local.

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

```pug
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

#### Layouts and blocks

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

## Booting

About the `Grown.env/new/burn()` mechanism.

### Server

Farms are created by instantiating application servers:

```js
const Grown = require('grown');

const cwd = process.cwd();

// initialize dot-env
Grown.env(cwd);

// a fresh farm
const $ = Grown.new({ cwd });
```

Callling `Grown.env()` is optional, but is there to help you loading `dot-env` settings.

If you don't pass a `cwd` value it will be taken from `process.cwd()` instead.

### API

&mdash; Retrieve and option value by its keypath

`$.get(option[, default])`

```js
const value = $.get('cwd');
const nestedValue = $.get('foo.bar');
const withDefaultValue = $.get('something', null);
```

If you don't provide a default value if the option is missing an exception will be thrown.

&mdash; Close the current server instance

`$.close([cb])`

```js
$.close(() => process.exit(0));

// or
$.close().then(() => {
  process.exit(0);
});
```

&mdash; Starts the server connection

`$.listen([connection[, opts, [, cb]]])`

Being called without arguments will use `http://0.0.0.0:80` as connection.

Otherwise connection should be a port-number, a full hostname, or even an object like:

```js
{
  protocol: 'https:',
  host: '0.0.0.0:80',
  port: 80,
}
```

Additional options and callback will be passed as-is to any `createServer()` call afterwards.

### Hooks

Farms has lifecycle events and hooks.

```js
// once you call $.run()
$.on('start', () => console.log('Starting application'));

// once you call $.stop()
$.on('close', () => console.log('Closing application'));

// once you call $.listen()
$.on('listen', () => console.log('Starting listener'));
$.on('done', () => console.log('Listener ready'));

// hooks from the REPL
$.on('repl', (repl, logger) => logger.ok('Hello CLI'));
$.on('reload', (repl, logger) => logger.ok('Reloading...'));
```

&mdash; Attach event listeners

`$.on(evt, cb)`

```js
$.on('delay', ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  }));
```

Event callbacks can return promises.

&mdash; Remove a single event listener

`$.off(evt, cb)`

```js
const cb = () => 42;

$.on('truth', cb);
$.off('truth', cb);
```

&mdash; Attach event listener once

`$.once(evt, cb)`

```js
$.once('reload', () => {
  console.log('Once and no more!');
});
```

&mdash; Emit event to its listeners

`$.emit(evt[, ...])`

```js
$.emit('delay', 1000)
  .then(() => console.log('OK'))
  .catch(() => console.log('FAIL'));
```

Emitted events are returned as promises.

### Plugins

Self-contained functionality can be plugged-in on your farms.

```js
$.use(ctx => {
  console.log($ === ctx); // true

  // enhance connection
  ctx.util.props({
    foo: Promise.resolve(42),
  })
  .then(result => {
    ctx.extensions.something = result;
  );
});
```

Built-in plugs are:

- `Grown.plugs.logger` &mdash; Add logging methods to the connection
- `Grown.plugs.models` &mdash; Support for look-up and loading models
- `Grown.plugs.render` &mdash; Support for views and layouts
- `Grown.plugs.router` &mdash; Support for app-routing
- `Grown.plugs.session` &mdash; Support for session and cookies
- `Grown.plugs.socket` &mdash; Support for SocketIO methods
- `Grown.plugs.testing` &mdash; Testing-wrapper harness
- `Grown.plugs.container` &mdash; Support for IoC/DI
- `Grown.plugs.formidable` &mdash; Support for file uploads

### Extensions

Plugins can and usually do enhance the `$.extensions` property.

All those values are attached to the connection instance:

```js
$.mount(conn => {
  console.log(conn.something); // { foo: 42 }
});
```

### Middlewares

Functions that can manipulate the connection details.

```js
$.mount(conn => {
  console.log('Before all middleware is run');

  return conn.next(() => {
    console.log('After all middleware was run');
  });
});
```

Express-middleware can be mounted too:

```js
$.mount(require('serve-static')(__dirname));
```

### Testing the app

You can leverage on `Grown.test()` for starting and adding hooks.

So a typical test-harness may involve no configuration:

```coffee
# spec/app-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'any application', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    # calling `Grown.test(app)` will return a function that:
    # - call `app.teardown()` to stop any previous instance
    # - setup a new `farm` by calling `app()`
    # - call `farm.run()`
    # - attach `farm.extensions` to `this`
    # - start listening at `test://`
    done()

  describe 'all extensions', ->
    it 'can be tested too', (done) ->
      # middleware and plugins can be loaded separatedly
      test = require('../boot/midlewares/test')
      result = null

      # assert or capture before
      @mount (conn) ->
        null

      # mount before using
      @mount test()

      # assert or capture after
      @mount (conn) ->
        result = conn.something_returned_by_middleware_test
        null

      # start requesting
      @server.fetch().then (res) ->
        expect(result).toEqual { foo: 42 }
        done()

      .catch (error) ->
        # capture in case of error
        console.log error
        done()
```

Depending on your needs you can go further.

### Interactive mode (reload)

To reload all your code without restarting the whole process call `.reload` on the REPL.

This action will also stop and teardown on any hooked events.

```js
$.on('close', () => {
  console.log('All connections were properly closed?');
});
```

Be sure to listen `close` for cleanup anything else.

## Asset pipeline

**Tarima** is used for that hard-thing: frontend.

Let's examine our default settings:

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
      "dest": "images"
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

### Images

### Static files

### Javascripts

### Stylesheets

### Templating (views)
