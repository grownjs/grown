---
title: Bare
$render: ../../../_/layouts/default.pug
---

### Static props

- `argv` &mdash; parsed argv from command-line
- `cwd` &mdash; current working directory
- `env` &mdash; `process.env.NODE_ENV`

### Static methods

- `do(body)` &mdash; wraps code into promises
- `use(module)` &mdash; register custom extensions
- `new([options])` &mdash; shortcut for `new Grown(...)`
- `load(cwd[, suffix])` &mdash; allow to collect extensions

---

➯ Next: [Extensions &rangle; CLI](./docs/extensions/cli)
