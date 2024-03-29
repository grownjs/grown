---
title: gRPC
next:
  label: Extensions &rangle; Logger
  link: docs/extensions/logger
$render: ~/src/lib/layouts/default.pug
---

Setup communication through services, all made out of your schemas and handlers.

```js
// register extension
const GRPC = Grown.use(require('@grown/grpc'));

fixture`./index.proto
  syntax = "proto3";
  package API;
  service Test {
    rpc is(Input) returns (Output) {}
  }
  message Input {
    int32 truth = 1;
  }
  message Output {
    string reveal = 1;
  }
`;

fixture`./handlers/Test/is/index.js
  module.exports = function ({ request }) {
    return {
      reveal: request.truth === 42,
    };
  };
`;

Grown.GRPC.Gateway({
  include: [
    GRPC.Loader.scan(__dirname + '/index.proto'),
  ],
});

const API = Grown.load(__dirname + '/handlers');
const gateway = Grown.GRPC.Gateway.setup(API, {
  timeout: 10,
}).start();

const result = await gateway.API.Test.is({ truth: 42 });

console.log('GOT:', result);
```

> This example does not work on Runkit, but it should work if you test it locally. 💣

---

## Loader

### Public methods <var>static</var>

- `scan(file[, options])` &mdash; Returns a mapping of all services found in the given `file`, `options` are given to `@grpc/proto-loader` when loading the file.

---

## Gateway

### Public methods <var>static</var>

- `setup(controllers[, options])` &mdash; Returns a gateway instance with services and controllers merged. Invoke them as `map.send<Service>(...)` or as `map.Service.method({ ... })` indistinctly.

  Supported options are:
  - `hostname(serviceName)` &mdash; Function, used to determine a host for service registration, fallback to `0.0.0.0` otherwise.
  - `timeout` &mdash; Number, timeout in seconds for gRPC deadline option; default to `undefined`.
  - `port`  &mdash; Number, custom port for service registration; default to `50051`.

> Calls to `hostname(...)` would return a port too, in such case is preferred and used instead.

### Private* methods <var>static</var>

- `_callService(options, client, method, data)` &mdash; Wrap used methods when calling services.
- `_getService(name, controller)` &mdash; Decorate all methods on given handlers.
- `_onError(e)` &mdash; Decorate errors thrown by calling services.
