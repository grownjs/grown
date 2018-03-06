---
title: The interface
$render: ../_/layouts/default.pug
---

Our main module is a factory which takes two optional arguments:

```js
const cwd = process.cwd();
const argv = process.argv.slice(2);

const Grown = require('grown')(cwd, argv);
```

> If no arguments are given both values will be taken from the current `process`

## Extensions

Once created, the `Grown` function behaves like a container, it can be called to
store and retrieve definitions from it.

```js
// register an extension
Grown('Application', {
  name: 'Example',
});

// both calls are equivalent
console.log(Grown.Application.name);
console.log(Grown('Application.name'));
```

## Instances

Invoking `new Grown` will return a [Server](./docs/extensions/server) instance.

> Actually, the [main module](https://github.com/pateketrueke/grown/blob/master/index.js)
> `grown` is a wrapper of `@grown/bare` and `@grown/server`

---

➯ Next: [APIs &rangle; Command line](./docs/command-line)
