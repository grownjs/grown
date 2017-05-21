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

Run `grown new -i` to start a new project interactively.

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

### 1.1 - Controllers

#### Routing

#### Definition

#### End responses

#### Testing actions

#### Interactive mode

### 1.2 - Models

#### JSON-Schema

#### Model syncing

#### Testing models

#### Interactive mode

### 1.3 - Views

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
