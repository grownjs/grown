---
title: Bud
next:
  label: Extensions &rangle; CLI
  link: docs/extensions/cli
$render: ~/src/lib/layouts/default.pug
---

The foundation of the whole framework is this, it provides the DSL
used by all extensions, expose common utils, etc.

```js
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

fixture`./exts/Test/truth/index.js
  module.exports = function () {
    return 42;
  };
`;

// load additional definitions
const Module = Grown.load(__dirname + '/exts');

// locate the dependency
assert(Module.get('Test').truth() === 42);

// don't do this... yet!
// new Grown();
```

> If you uncomment `// new Grown()` and re-run the code it'll throw an error since `Server` is not available! 💣

---

### Public props <var>static</var>

- `argv` &mdash; Parsed argv from command-line.
- `cwd` &mdash; Current working directory.
- `pkg` &mdash; Current package.json contents.
- `env` &mdash; Current `process.env.NODE_ENV` value.

### Public methods <var>static</var>

- `do(body)` &mdash; Wraps code into promises with `rescue` abilities.
- `use(module)` &mdash; Register custom extensions from external modules.
- `new([options])` &mdash; Shortcut for `new Grown(...)` constructor.
- `def(name, cwd[, opts])` &mdash; Load and register definitions from the given `cwd`.
- `defn(name, value)` &mdash; Set static values into the `Grown` container, once.
- `bind(prefix, cwd)` &mdash; Configure custom module resolution through prefixes.
- `load(cwd[, hooks])` &mdash; Build module definitions from this directory.
  If `hooks` are given, found modules will be passed to them, so they can be
  extended or completely replaced.
