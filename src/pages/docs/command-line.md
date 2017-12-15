---
title: Command line
$render: ../../_layouts/default.pug
---

# Command line


## Application script

```js
const Grown = require('@grown/grown')();

module.exports = () => {
  const server = new Grown();

  return server;
};
```

---

## REPL script

```js
const Grown = require('@grown/grown')();

Grown.use(require('@grown/repl'));

Grown.REPL.start({
  example(ctx) {
    // Node's REPL instance
    ctx.repl;

    // log-pose instance
    ctx.logger;
  },
});
```

See: [`log-pose` methods](https://github.com/pateketrueke/log-pose)

---

## Server script

```js
module.exports = () => {
  const serverFactory = require('./app');
  const server = serverFactory();

  server.listen(8080);
};

if (require.main === module) {
  module.exports();
}
```
