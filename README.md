# Homegrown

[![travis-ci](https://api.travis-ci.org/pateketrueke/homegrown.svg)](https://travis-ci.org/pateketrueke/homegrown) [![codecov](https://codecov.io/gh/pateketrueke/homegrown/branch/master/graph/badge.svg)](https://codecov.io/gh/pateketrueke/homegrown)

Experimental DSL for web applications.

```bash
$ npm i homegrown -S
```

## Farms

Use `farms()` to retrieve all created instances, e.g.

```js
const homegrown = require('homegrown');

homegrown.farms().forEach((farm) => {
  // context reference
  farm.context;
  // options from new() factory
  farm.options;
  // pipeline reference from passed mount() callbacks
  farm.pipeline;
  // extensions are be copied to all created server instances
  farm.extensions;
});
```

By calling `new()` you can create a new farm of web servers, e.g.

```js
const farm1 = homegrown.new();
```

Each farm instance has the following properties and methods:

### `use()`

Plugin support for extra functionality, e.g.

```js
farm1.use((container) => {
  container.context;
  container.options;
  container.pipeline;
  container.extensions;
});
```

### `mount()`

Register a new callback on the main loop, e.g.

```js
farm1.mount((conn) => {
  // shared application context
  conn.ctx;
  // request and response
  conn.req;
  conn.res;
  // current environment (default: dev)
  conn.env;
  // normalized query
  conn.query;
  // normalized input-body
  conn.input;
  // normalized content-type
  conn.type;
  // dynamic response getter/setter
  conn.body;
  // finalize response
  conn.end();
  // prepare final response
  conn.send();
  // read request headers
  conn.get();
  // write response headers
  conn.set();
  // remove response haders
  conn.unset();
  // set response status
  conn.status();
  // perform redirects
  conn.redirect();
});
```

### `listen()`

Instantiate a new request listener, e.g.

```js
farm1.listen(3000, (app) => {
  // instance of Url
  app.location;
  // normalized host/port
  app.port;
  app.host;
  // close instantiated server
  app.close();
});
```

### `hosts`

Instantiated applications grouped by host, e.g.

```js
{
  '0.0.0.0:3000': {
    // object created by listen()
  }
}
```

### `servers`

Created listeners grouped by port, e.g.

```js
{
  '3000': {
    // object returned by farm1.protocols[$protocol].createServer(...)
    // where $protocol can be "http", "https" or "test", etc.
  }
}
```

### `protocols`

Required support for used protocols, e.g.

```js
{
  // supported protocols can be overloaded or faked completely,
  // see https://github.com/pateketrueke/homegrown/blob/master/test.js
  http: require('http')
}
```
