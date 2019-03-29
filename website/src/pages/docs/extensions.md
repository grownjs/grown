---
title: Extensions
$render: ../../_/layouts/default.pug
---

More functionality can be added through the `Grown` container, e.g. **api/index.js**

```js
module.exports = Grown => {
  return Grown('API', {
    include: [
      Grown.load(`${__dirname}/controllers`),
    ],
  });
};
```

> `Grown` extensions are [`object-new`](https://www.npmjs.com/package/object-new#definitions) definitions, however, any compatible declaration would work.

The `load()` method will scan and require any modules found within any given folder.

> Modules MUST be compatible with the [`sastre`](https://www.npmjs.com/package/sastre) layout for source files, so the files from above should be named `./api/controllers/<ControllerName>/index.js` in order to work.

## Using extensions

Now, you can register those extensions on your main application, e.g.

```js
// register an extension
Grown.use(require('./api'));

// both calls are equivalent
console.log(Grown.API.Home.name);
console.log(Grown('API.Home.name'));
```

Built-in extensions are registered the same way:

```js
Grown.use(require('@grown/session'));
Grown.use(require('@grown/router'));
Grown.use(require('@grown/test'));
// etc.
```

---

➯ Next: [Extensions &rangle; Access](./docs/extensions/access)
