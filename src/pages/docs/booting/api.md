---
title: FTW
$render: ../../../_layouts/default.pug
---

### API

&mdash; Retrieve and option value by its keypath:

`$.get(option[, default])`

```js
const value = $.get('cwd');
const nestedValue = $.get('foo.bar');
const withDefaultValue = $.get('something', null);
```

If you don't provide a default value if the option is missing an exception will be thrown.

&mdash; Close the current server instance:

`$.close([cb])`

```js
$.close(() => process.exit(0));

// or
$.close().then(() => {
  process.exit(0);
});
```

&mdash; Starts the server connection:

`$.listen([connection[, opts, [, cb]]])`

Being called without arguments will use `http://0.0.0.0:80` as connection.

Otherwise connection should be a port-number, a full hostname, or even an object like:

```js
{
  protocol: 'https:',
  host: '0.0.0.0:80',
  port: 80,
}
```

Additional options and callback will be passed as-is to any `createServer()` call afterwards.

### Hooks

Farms has lifecycle events and hooks.

```js
// once you call $.run()
$.on('start', () => console.log('Starting application'));

// once you call $.stop()
$.on('close', () => console.log('Closing application'));

// once you call $.listen()
$.on('listen', () => console.log('Starting listener'));
$.on('done', () => console.log('Listener ready'));

// hooks from the REPL
$.on('repl', (repl, logger) => logger.ok('Hello CLI'));
$.on('reload', (repl, logger) => logger.ok('Reloading...'));
```

&mdash; Attach event listeners:

`$.on(evt, cb)`

```js
$.on('delay', ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  }));
```

Event callbacks can return promises.

&mdash; Remove a single event listener:

`$.off(evt, cb)`

```js
const cb = () => 42;

$.on('truth', cb);
$.off('truth', cb);
```

&mdash; Attach event listener once:

`$.once(evt, cb)`

```js
$.once('reload', () => {
  console.log('Once and no more!');
});
```

&mdash; Emit event to its listeners:

`$.emit(evt[, ...])`

```js
$.emit('delay', 1000)
  .then(() => console.log('OK'))
  .catch(() => console.log('FAIL'));
```

Emitted events are returned as promises.
