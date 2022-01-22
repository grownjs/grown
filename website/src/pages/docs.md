---
title: The interface
next:
  label: APIs &rangle; Command line
  link: docs/command-line
$render: ~/src/lib/layouts/default.pug
---

Our main module is a factory which takes two optional arguments:

```js
const cwd = process.cwd();
const argv = process.argv.slice(2);

const Grown = require('grown')(cwd, argv);
```

> If no arguments are given both values will be taken from the current `process`.

These options will be used later by the container and its extensions &mdash; i.e. see `Grown.cwd` and `Grown.argv` on the created container.

## Extensions

Once created, the `Grown` function behaves like a container, it can be called to
store and retrieve definitions from it.

```js
// register an extension
Grown('Application', {
  name: 'Example',
});

// properties can be accessed in two ways:
assert(Grown.Application.class === 'Application');
assert(Grown('Application.class') === 'Application');
assert(Grown('Application.name') === Grown.Application.name);
```

If you access an extension that is not defined yet, its reference will still hold the definition once registered or patched.

```js
// retrieve a dummy extension
const Test = Grown('Example');

// register the extension
Grown('Example', {
  truth: 42,
});

// here, both values are 42
assert(Grown.Example.truth === Test.truth);

// patch the extension
Grown('Example', {
  truth: -1,
});

// now, both values are -1
assert(Grown.Example.truth === Test.truth);
```

## Instances

Calling `new Grown()` you'll get a [Server](./docs/extensions/server) instance but keep reading before you get warm.

> Behind scenes, the [main module](https://github.com/grownjs/grown/blob/master/index.js)
> `grown` is a wrapper of `@grown/bud` and `@grown/server`

### Highlights

- Module definitions are registered if you pass a name and object.
- Module definitions can be accessed by their name, or like objects.
