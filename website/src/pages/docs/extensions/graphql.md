---
title: GraphQL
$render: ../../../lib/layouts/default.pug
runkit:
  endpoint: true
  preamble: |
    const fs = require('fs');
    const assert = require('assert');
    fs.mkdirSync('./handlers');
    fs.mkdirSync('./handlers/Test');
    fs.mkdirSync('./handlers/Test/Query');
    fs.mkdirSync('./handlers/Test/Query/truth');
    fs.writeFileSync('./handlers/Test/Query/truth/index.js', `
      module.exports = function () { return 42; };
    `);
    fs.writeFileSync('./index.gql', `
      type Mutation { noop: Int }
      type Query { truth: Int }
    `);
    const Grown = require('@grown/bud')();
    Grown.use(require('@grown/server'));
    const server = new Grown();
    global.__dirname=process.cwd();
    process.nextTick(() => server.listen(8080));
---

Build high-level endpoints for your API consumers.

```js
/* @runkit */
// register extension
Grown.use(require('@grown/graphql'));

// ./index.gql
// type Mutation { noop: Int }
// type Query { truth: Int }

// ./handlers/Test/Query/truth/index.js
// module.exports = function () {
//   return 42;
// };

// mount our GraphQL API
server.mount('/', Grown.GraphQL
  .setup([`${__dirname}/index.gql`],
    Grown.load(`${__dirname}/handlers`)));
```

> Try asking with your GraphQL client: `query { truth }`.

### Public methods <var>static</var>

- `setup(schemas, container)` &mdash; Returns a middleware ready to be mounted into the server instance. Given `schemas` are expected to be an array of `*.gql` files and `container` is the implementation.

### Private* methods <var>static</var>

- `_startGraphQLServer(typeDefs, resolvers)` &mdash; Used by `setup()` to build the GraphQL middleware.
- `_bindGraphQLServer(schemas, container)` &mdash; Used by `setup()` to decorate the given handlers.

---

➯ Next: [Extensions &rangle; GRPC](./docs/extensions/grpc)
