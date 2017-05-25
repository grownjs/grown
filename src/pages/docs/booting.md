---
title: FTW
$render: ../../_layouts/default.pug
---

## Booting

About the `Grown.env/new/burn()` mechanism.

### Server

Farms are created by instantiating application servers:

```js
const Grown = require('grown');

const cwd = process.cwd();

// initialize dot-env
Grown.env(cwd);

// a fresh farm
const $ = Grown.new({ cwd });
```

Callling `Grown.env()` is optional, but is there to help you loading `dot-env` settings.

If you don't pass a `cwd` value it will be taken from `process.cwd()` instead.

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

### Plugins

Self-contained functionality can be plugged-in on your farms.

```js
$.use(ctx => {
  console.log($ === ctx); // true

  // enhance connection
  ctx.util.props({
    foo: Promise.resolve(42),
  })
  .then(result => {
    ctx.extensions.something = result;
  );
});
```

&mdash; Built-in plugs are:

- `Grown.plugs.logger` &rarr; Add logging methods to the connection
- `Grown.plugs.models` &rarr; Support for look-up and loading models
- `Grown.plugs.render` &rarr; Support for views and layouts
- `Grown.plugs.router` &rarr; Support for app-routing
- `Grown.plugs.session` &rarr; Support for session and cookies
- `Grown.plugs.socket` &rarr; Support for SocketIO methods
- `Grown.plugs.testing` &rarr; Testing-wrapper harness
- `Grown.plugs.container` &rarr; Support for IoC/DI
- `Grown.plugs.formidable` &rarr; Support for file uploads

### Extensions

Plugins can and usually do enhance the `$.extensions` property.

&mdash; All those values are attached to the connection instance:

```js
$.mount(conn => {
  console.log(conn.something); // { foo: 42 }
});
```

### Middlewares

Functions that can manipulate the connection details.

```js
$.mount(conn => {
  console.log('Before all middleware is run');

  return conn.next(() => {
    console.log('After all middleware was run');
  });
});
```

&mdash; Express-middleware can be mounted too:

```js
$.mount(require('serve-static')(__dirname));
```

### Testing the app

You can leverage on `Grown.test()` for starting and adding hooks.

&mdash; So a typical test-harness may involve no configuration:

```coffee
# spec/app-spec.coffee

app = require('../app/server')
Grown = require('grown')

describe 'any application', ->
  beforeEach Grown.test(app)

  it 'can be tested', (done) ->
    # calling `Grown.test(app)` will return a function that:
    # - call `app.teardown()` to stop any previous instance
    # - setup a new `farm` by calling `app()`
    # - call `farm.run()`
    # - attach `farm.extensions` to `this`
    # - start listening at `test://`
    done()

  describe 'all extensions', ->
    it 'can be tested too', (done) ->
      # middleware and plugins can be loaded separatedly
      test = require('../boot/midlewares/test')
      result = null

      # assert or capture before
      @mount (conn) ->
        null

      # mount before using
      @mount test()

      # assert or capture after
      @mount (conn) ->
        result = conn.something_returned_by_middleware_test
        null

      # start requesting
      @server.fetch().then (res) ->
        expect(result).toEqual { foo: 42 }
        done()

      .catch (error) ->
        # capture in case of error
        console.log error
        done()
```

Depending on your needs you can go further.

### Interactive mode (reload)

Reload all your code without restarting the whole process call `.reload` on the REPL.

&mdash; Closing the farm will also stop and teardown any hooked events:

```js
$.on('close', () => {
  console.log('All connections were properly closed?');
});
```

Be sure to listen `close` for cleanup anything else.

- [back](/)
- [next](/docs/assets)
