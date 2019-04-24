---
title: Bud
$render: ../../../lib/layouts/default.pug
runkit:
  preamble: |
    const fs = require('fs');
    const assert = require('assert');
    fs.mkdirSync('./exts');
    fs.mkdirSync('./exts/Test');
    fs.mkdirSync('./exts/Test/handler');
    fs.writeFileSync('./exts/Test/handler/index.js',
      'module.exports = function () { return 42; };');
---

The foundation of the whole framework is this, it provides the DSL
used by all extensions, expose common utils, etc.

```js
/* @runkit */
const Grown = require('@grown/bud')();
const Util = require('@grown/bud/util');

// extends the Grown-container
Grown.use(($, util) => {
  assert($ === Grown);
  assert(util === Util);
});

// build a promise-guard for callbacks
const cb = Grown.do(rescue => {
  rescue(e => {
    // you can use this block to
    // catch-up things on a failure
    assert(e instanceof Error);
  });

  // any errors thrown here will reject
  // the created promise, also they'll be
  // logged through `Util.getLogger().error`
  throw new Error('E_FAILURE');
});

cb();

// ./exts/Test/handler/index.js
// module.exports = function () {
//   return 42;
// };

// load additional definitions
const Exts = Grown.load(`${__dirname}/exts`);

// locate the dependency
assert(Exts.get('Test').handler() === 42);

// don't do this!
// new Grown();
```

> Invoking `new Grown()` will throw an error if `Server` is not available!

---

### Public props <var>static</var>

- `argv` &mdash; Parsed argv from command-line.
- `cwd` &mdash; Current working directory.
- `env` &mdash; Current `process.env.NODE_ENV` value.

### Public methods <var>static</var>

- `do(body)` &mdash; Wraps code into promises with `rescue` abilities.
- `use(module)` &mdash; Register custom extensions from external modules.
- `new([options])` &mdash; Shortcut for `new Grown(...)` constructor.
- `defn(name, value)` &mdash; Set static values into the `Grown` container, once.
- `load(cwd[, hooks])` &mdash; Build module definitions from this directory.
  If `hooks` are given, found modules will be passed to them, so they can be
  extended or completely replaced.

---

➯ Next: [Extensions &rangle; CLI](./docs/extensions/cli)
