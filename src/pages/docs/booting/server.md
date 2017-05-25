---
title: FTW
$render: ../../../_layouts/default.pug
---

### Server

Farms are created by instantiating application servers:

```js
const Grown = require('grown');

const cwd = process.cwd();

// initialize dot-env
Grown.env(cwd);

// a fresh farm
const $ = Grown.new({ cwd });
```

Callling `Grown.env()` is optional, but is there to help you loading `dot-env` settings.

If you don't pass a `cwd` value it will be taken from `process.cwd()` instead.
