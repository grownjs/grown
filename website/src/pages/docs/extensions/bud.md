---
title: Bud
$render: ../../../_/layouts/default.pug
---

The foundation of the whole framework is this, it provides the DSL
used by all extensions, expose common utils, etc.

```js
/* @runkit */
const Grown = require('@grown/bud')();
const Util = require('@grown/bud/util');

// both references are passed on use() calls
Grown.use(($, util) => {
  console.log($ === Grown);
  console.log(Util === util);
});
```

> Note that invoking `new Grown` will throw an error because `Server` is not available

### Public props <var>static</var>

- `argv` &mdash; parsed argv from command-line
- `cwd` &mdash; current working directory
- `env` &mdash; `process.env.NODE_ENV`

### Public methods <var>static</var>

- `do(body)` &mdash; wraps code into promises
- `use(module)` &mdash; register custom extensions
- `new([options])` &mdash; shortcut for `new Grown(...)`
- `load(cwd[, suffix])` &mdash; allow to collect extensions

---

➯ Next: [Extensions &rangle; CLI](./docs/extensions/cli)
