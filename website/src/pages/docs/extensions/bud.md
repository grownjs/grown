---
title: Bud
$render: ../../../_/layouts/default.pug
runkit:
  preamble: |
    const fs = require('fs');
    const assert = require('assert');
    fs.mkdirSync('./exts');
    fs.writeFileSync('./exts/TestHandler.js',
      'module.exports = $ => $("TestHandler");');
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
  assert(Util === util);
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

// ./exts/TestHandler.js
// module.exports = Grown => {
//   return Grown('TestHandler');
// };

// load additional definitions
const extsDir = `${__dirname}/exts`;
const Exts = Grown.load(extsDir, 'Handler');

// define a new extension
Grown('Handlers', {
  include: [
    Exts,
  ],
});

// all definitions are equivalent
const Test = Grown('Handlers.TestHandler');

assert(Test.name === 'TestHandler');
assert(Test.name === Exts.Test.name);
assert(Test.name === Grown.TestHandler.name);
```

> Note that invoking `new Grown` will throw an error because `Server` is not available

---

### Public props <var>static</var>

- `argv` &mdash; parsed argv from command-line
- `cwd` &mdash; current working directory
- `env` &mdash; `process.env.NODE_ENV`

### Public methods <var>static</var>

- `do(body)` &mdash; wraps code into promises
- `use(module)` &mdash; register custom extensions
- `new([options])` &mdash; shortcut for `new Grown(...)`
- `load(cwd[, suffix[, callback]])` &mdash; allow to collect extensions

---

➯ Next: [Extensions &rangle; CLI](./docs/extensions/cli)
