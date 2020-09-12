---
title: GraphQL
$render: ~/src/lib/layouts/default.pug
runkit:
  endpoint: true
  preamble: !include ~/src/lib/shared/chunks/graphql.js
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

> Click <kbd>► RUN</kbd> and then ask with your GraphQL client: `query { truth }` &mdash; or try requesting through [`this link`](/?body=query{truth}).

<div id="target"></div>

### Public methods <var>static</var>

- `setup(schemas, container)` &mdash; Returns a middleware ready to be mounted into the server instance. Given `schemas` are expected to be an array of `*.gql` files and `container` is the implementation.

### Private* methods <var>static</var>

- `_startGraphQLServer(typeDefs, resolvers)` &mdash; Used by `setup()` to build the GraphQL middleware.
- `_bindGraphQLServer(schemas, container)` &mdash; Used by `setup()` to decorate the given handlers.

---

➯ Next: [Extensions &rangle; GRPC](./docs/extensions/grpc)
