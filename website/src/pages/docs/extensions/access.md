---
title: Access
$render: ../../../_/layouts/default.pug
---

### Public props <var>static</var>

- `resources` &mdash;
- `permissions` &mdash;

### Public methods <var>static</var>

- `$install(ctx)` &mdash;
- `$mixins()` &mdash;
- `rules(config)` &mdash;

---

### Private* props <var>static</var>

- `_groups` &mdash;
- `_ruleset` &mdash;

### Private* methods <var>static</var>

- `_reduceHandler(handler, permissions)` &mdash;
- `_compileMatch(rule)` &mdash;
- `_makeMatcher(ruleset)` &mdash;
- `_makeTree(role, groups, property)` &mdash;
- `_runACL(conn, role, handlers)` &mdash;

---

➯ Next: [Extensions &rangle; Bare](./docs/extensions/bare)
