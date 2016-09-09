# grown

[![travis-ci](https://api.travis-ci.org/pateketrueke/grown.svg)](https://travis-ci.org/pateketrueke/grown) [![codecov](https://codecov.io/gh/pateketrueke/grown/branch/master/graph/badge.svg)](https://codecov.io/gh/pateketrueke/grown)

Experimental DSL for web applications.

```bash
$ npm i grown -S
```

## Servers

By calling `grown()` you can create new web servers.

```js
const grown = require('grown');
const server1 = grown();
const server2 = grown();
```

Each server instance has the following properties and methods:

- `hosts` &mdash; applications grouped by host
- `servers` &mdash; listeners grouped by port
- `protocols` &mdash;

## Listeners

- `listen()` &mdash;

## Dispatching

- `dispatch()` &mdash;

## Middlewares

- `mount()` &mdash;

## Extensions

- `use()` &mdash;
