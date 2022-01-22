---
title: Extensions
next:
  label: Extensions &rangle; Access
  link: docs/extensions/access
$render: ~/src/lib/layouts/default.pug
---

Most functionality can be added through the `Grown` container, i.e. the `load()` method will scan and require any modules found within any given folder.

```js
fixture`./api/index.js
  module.exports = Grown => {
    return Grown('API', {
      include: [
        Grown.load(__dirname + '/controllers'),
      ],
    });
  };
`;

fixture`./api/controllers/Test/truth/index.js
  module.exports = function () {
    return 42;
  };
`;

// register an extension
Grown.use(require('./api'));

assert(Grown.API.Test.truth() === 42);
```

Built-in extensions are registered the same way:

```js
Grown.use(require('@grown/session'));
Grown.use(require('@grown/router'));
Grown.use(require('@grown/test'));
// etc.
```

> In the next pages you'll be guided through the available extensions.

### Highlights

- Definitions are made of function factories, they return a new `Grown` extension when used.
- Definitions are then registered on the container through the `Grown.use` funcion, hence the name.
- Definitions are built using the [object-new](https://github.com/grownjs/object-new) DSL for the extensions and the [sastre](https://github.com/tacoss/sastre) layout for the modules.
