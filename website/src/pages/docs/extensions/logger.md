---
title: Logger
$render: ~/src/lib/layouts/default.pug
runkit: !include ~/src/lib/shared/runkit/server.yml
---

Enable shared and custom logging in your applications.


```js
// register extension
const Logger = Grown.use(require('@grown/logger'));

Logger.getLogger().info('This works?');
Logger.setLevel('debug');

// always show, not restricted by level
Logger.message('OK');
Logger.error('ERROR');

// register middleware
server.plug(Grown.Logger);

// use with server
server.mount(conn => {
  // shown, because `debug > info`
  conn.logger.info('INFO');
  conn.logger.debug('DEBUG');

  // not shown, because `verbose > debug`
  conn.logger.verbose('VERBOSE');
});
```

> Click <kbd>► RUN</kbd> and try requesting through [`this link`](/).

<div id="target"></div>

### Methods <var>mixin</var>

- `logger` &mdash; Log-pose instance, [see docs](https://www.npmjs.com/package/log-pose)
  - `isEnabled()` &mdash; Returns if logging is globally enabled.
  - `isVerbose()`, `isDebug()` and `isInfo()` &mdash; Returns true if log-level is enabled, respectively.
  - `printf(...)`  and `write(...)` &mdash; Low-level methods from log-pose internals
  - `verbose(...)`, `debug(...)` and `info(...)` &mdash; High-level methods from log-pose

### Public methods <var>static</var>

- `$before_render(ctx, template)` &mdash; Append or replace `{elapsed}` on the response body, only if `Render` is available
- `$before_send(e, ctx)` &mdash; Hook for calculating the `{elapsed}` time before sending anything, see above
- `$install(ctx)` &mdash; Used by `server.plug` calls.
- `$mixins()` &mdash; Extra `Grown.Conn.Builder` definitions.
- `message(...)` and `error(...)` &mdash; Standard logging helpers.
- `pause()` and `resume()` &mdash; To turn off/on logging respectively.
- `setLevel(type)` &mdash; Set active level of logging.
- `setLogger([stdout])` &mdash; Define output target (default to `process.stdout`)
- `getLogger(depth[, stdout])` &mdash; Return shared logger instance, optional output as above
- `newLogger(prefix, level, depth[, stdout])` &mdash; Returns a custom log-pose interface

### Private* methods <var>static</var>

- `_elapsedTime()` &mdash; Used by `$before_render`.
- `_errorLog(value)` &mdash; Override output for errors.
- `_msgLog(value)` &mdash; Override output for regular logs.

---

➯ Next: [Extensions &rangle; Model](./docs/extensions/model)
