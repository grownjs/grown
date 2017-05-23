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

### More settings

Run `grown new -y` to start a new project interactively.

Also, you can specify each preset manually on the command line, e.g.

```bash
$ grown new . ES6=traceur BUNDLER=rollup STYLES=less DATABASE=sqlite
```

### Known issues

- `Cannot find module 'talavera'`

  Run `yarn` or `npm i` without arguments again, it will try to reinstall `talavera` for you.


## 1.0 - Overview

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

### 1.1 - Interactive mode

Execute `grown repl` to start an interactive session.

You can explore the available actions typing `.help` and hitting ENTER.

Most actions responds to the same syntax `arg1 arg2 ... -pq x=y a:b` where:

- `argN` are regular values (can be quoted)
- `-pq` are **flag** values (short or long, as CLI does)
- `x=y` are **data** values (can be quoted, e.g. `x="foo bar"`)
- `a:b` are **param** values (can be quoted, e.g. `a:"foo bar"`)

Try with `.render layouts/default csrf_token="oh noes" yield=OSOM` and see the results.

> Save/load different REPL sessions using the `-i` flag, e.g. `grown repl -i debug`

### 1.2 - Controllers

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

#### Interactive mode

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

### 1.3 - Models

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

describe 'some models', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    @models.Dummy.findAll().then (result) ->
      expect(result.length).toEqual 0
      done()
```

#### Interactive mode

Within the REPL you can run `.models` to inspect them.

All models are available within the REPL context, so `Dummy` will be a local.

### 1.4 - Views

#### Functions as templates

#### Pre-compiled templates

#### layout and blocks

#### Testing views

#### Interactive mode

## 2.0 - Booting

### Server

### Plugins

### Initializers

### Middlewares

### Testing the app

### Interactive mode

## 3.0 - Asset pipeline

### Stylesheets

### Javascripts

### Static files

### Images
