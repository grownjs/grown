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
├── package.json
├── bin
│   └── server
├── app
│   ├── server.js
│   ├── assets
│   │   ├── images
│   │   ├── javascripts
│   │   │   └── application.js
│   │   └── stylesheets
│   │       └── application.css
│   ├── controllers
│   │   └── Home.js
│   ├── models
│   └── views
│       └── layouts
│           └── default.js
├── boot
│   ├── initializers
│   └── middlewares
│       ├── body-parsers.js
│       ├── csrf-protection.js
│       ├── method-override.js
│       └── no-cache.js
├── config
│   ├── middlewares.js
│   └── routes.js
├── public
│   └── robots.txt
├── build
├── log
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

Route mappings are defined in the `config/routes.js` file.

```js
module.exports = map =>
  map()
    .root('Home#index')
    .get('/login', 'Session#login')
    .delete('/login', 'Session#logout')
    .namespace('/account', map =>
      map()
        .root('Account#profile'));
```

Each time you call a `map()` factory you can pass values and they will be inherited down

#### Definition

Let's examine the `app/controllers/Home.js` source:

```js
module.exports = {
  methods: {
    index() {}
  },
};
```
By the mere fact of being declared, the render system will try to render a `Home/index` view.

#### End responses

Any method receives the connection object, in turn it can responds or return a string,
buffer, stream or promise:

```js
index(conn) {
  conn.resp_body = '42';
  // return 42;
  // return new Buffer('42');
  // return Promise.resolve(42);
}
```

Call `put_status()` to set a proper status code:

```js
conn.put_status(400);
conn.resp_body = { status: 'error', message: 'Invalid input' };
```

#### Testing actions

#### Interactive mode

### 1.3 - Models

#### JSON-Schema

#### Model syncing

#### Testing models

#### Interactive mode

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
