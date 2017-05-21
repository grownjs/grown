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

## More settings

Run `grown new -i` to start a new project interactively.

Also, you can specify each preset manually on the command line, e.g.

```bash
$ grown new . ES6=traceur BUNDLER=rollup STYLES=less DATABASE=sqlite
```

## Known issues

- `Cannot find module 'talavera'`

  Run `yarn` or `npm i` without arguments again, it will try to install `talavera` for you.
