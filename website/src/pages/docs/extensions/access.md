---
title: Access
$render: ../../../_/layouts/default.pug
runkit: !include ../../../_/shared/runkit.yml
---

Allow or deny access on certain resources from your application, e.g.

```js
/* @runkit */
// register extension
Grown.use(require('@grown/access'));

// overload definition
Grown('Access', {
  access_filter: ctx => {
    // retrieve role from the URL
    const matches = ctx.req.url.match(/[&?]role=(\w+)/);

    if (matches) {
      return matches[1];
    }
  },
});

// setup rules
server.plug([
  Grown.Access.rules({
    roles: [
      'Guest.User.Admin',
    ],
    resources: {
      // this rule will block all requests
      Website: '/**',

      // but only these requests will be allowed
      Public: /^\/(?:login|logout|public)/,
    },
    permissions: {
      Website: {
        // User and its parents' roles get access too!
        User: 'allow',
      },
      Public: 'allow',
    },
  }),
]);

// middleware
server.mount(ctx => {
  ctx.res.write('You are welcome!');
});
```

---

### Methods <var>mixin</var>

- `check(role, resource, action)` &mdash;

### Public props <var>static</var>

- `resources` &mdash;
- `permissions` &mdash;

### Public methods <var>static</var>

- `$install(ctx)` &mdash;
- `$mixins()` &mdash;
- `rules(config)` &mdash;

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
