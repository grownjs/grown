---
title: Extensions
$render: ../../_/layouts/default.pug
---

Additional functionality can be added through the `Grown` container, e.g. **controllers/index.js**

```js
module.exports = Grown => {
  return Grown('Controllers', {
    include: [
      Grown.load(__dirname, 'Controller'),
    ],
  });
};
```

> `Grown` extensions are just [`object-new`](https://www.npmjs.com/package/object-new#definitions) definitions

## Loading definitions

The `load()` method will scan and require any modules matching the given suffix, e.g. **controllers/HomeController.js**

```js
module.exports = Grown => {
  return Grown('HomeController');
};
```

> Given suffix is stripped from the module name and then it's registered on the container

## Using extensions

Now, you can register those extensions on your main application, e.g.

```js
// register an extension
Grown.use(require('./controllers'));

// both calls are equivalent
console.log(Grown.HomeController.name);
console.log(Grown.Controllers.Home.name);
```

> Modules named after `Controller` should work too, e.g. **controllers/HomeController/index.js**

---

➯ Next: [Extensions &rangle; Access](./docs/extensions/access)
