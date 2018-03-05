---
title: Access
$render: ../../../_layouts/default.pug
---

## WIP

```js
const Grown = require('grown')();
Grown.use(require('@grown/router'));

const server = new Grown();
server.plug(Grown.Router);

server.get('/', ctx => {
  ctx.res.write('OK');
});

server.listen();
```
