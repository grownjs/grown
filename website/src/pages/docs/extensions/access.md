---
title: Access
next:
  label: Extensions &rangle; Bud
  link: docs/extensions/bud
$render: ~/src/lib/layouts/default.pug
runkit: !include ~/src/lib/shared/runkit/server.yml
---

Allow or deny access on certain resources from your application, e.g.

```js
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

// once Access is plugged on the server
// all new middleware gets protected by default
server.mount(ctx => {
  ctx.res.write('You are welcome!');

  // validate against undefined rules
  return ctx.check('Foo', 'Bar', 'baz')
    .catch(() => {
      ctx.res.write('\nNot here...');
    });
});
```

> Click <kbd>▷ RUN</kbd> on the code-block and then try different URLs like [`/etc`](/etc) or [`/login`](/login) below.

<div id="target"></div>

---

### Config <var>mixin</var>

- `access_filter(ctx)` &mdash; When given, it'll be used as described below. It must be passed through patching the extension.

### Methods <var>mixin</var>

- `check(role, resource[, action])` &mdash; Validate given rules through the current connection, returns a promise.
  If no `role` is given it'll try to call `access_filter` to retrieve one.

### Public props <var>static</var>

- `resources` &mdash; Collected resources from `rules` calls.
- `permissions` &mdash; Collected permissions from `rules` calls.

### Public methods <var>static</var>

- `$install(ctx)` &mdash; Used by `server.plug` calls.
- `$mixins()` &mdash; Extra `Grown.Conn.Builder` definitions.
- `rules(config)` &mdash; Compile given `config` as access rules and returns a middleware.

### Private* props <var>static</var>

- `_groups` &mdash; Graph from collected roles.
- `_ruleset` &mdash; Collection of compiled rules.

### Private* methods <var>static</var>

- `_reduceHandler(handler, permissions)` &mdash; Check if `handler` exists within `permissions`, returns `null` otherwise.
- `_compileMatch(rule)` &mdash; Turns a single `rule` into a middleware callback.
- `_makeMatcher(ruleset)` &mdash; Iterates the given `ruleset` and compile each one. It returns a middleware callback.
- `_makeTree(role, groups, property)` &mdash; Returns a flat representation of the given `role` in the `groups` graph, `property` can be `children` or `parent`.
- `_runACL(ctx, role, handlers)` &mdash; Validate `role` access through `ctx`. Given `handlers` should be an array of single resources and actions. It returns a promise.
