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

See: [`object-new` definitions](https://www.npmjs.com/package/object-new#definitions)


### Instances

Invoking `new Grown` will return a [Server](./docs/extensions/server) instance.

> Actually, the [main module](https://github.com/pateketrueke/grown/blob/master/index.js)
> `grown` is a wrapper of `@grown/bare` and `@grown/server`

### Static props

- `argv` &mdash; parsed argv from command-line
- `cwd` &mdash; current working directory
- `env` &mdash; `process.env.NODE_ENV`

### Static methods

- `do(body)` &mdash; wraps code into promises
- `use(module)` &mdash; register custom extensions
- `new([options])` &mdash; shortcut for `new Grown(...)`
- `load(cwd[, suffix])` &mdash; allow to collect extensions

---

➯ Next: [APIs &rangle; Command line](./docs/command-line)
