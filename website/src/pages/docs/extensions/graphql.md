---
title: GraphQL
next:
  label: Extensions &rangle; gRPC
  link: docs/extensions/grpc
$render: ~/src/lib/layouts/default.pug
runkit:
  endpoint: true
  preamble: !include ~/src/lib/shared/chunks/server.js
---

Build high-level endpoints for your API consumers.

```js
// register extension
Grown.use(require('@grown/graphql'));

fixture`./example.gql
  type Mutation { noop: Int }
  type Query { truth: Int }
`;

fixture`./resolvers/Test/Query/truth/index.js
  module.exports = function () {
    return 42;
  };
`;

// mount our GraphQL API
server.mount('/', Grown.GraphQL
  .setup([`${__dirname}/example.gql`],
    Grown.load(`${__dirname}/resolvers`)));
```

> Click <kbd>▷ RUN</kbd> and then ask with your GraphQL client: `query { truth }` &mdash; or try requesting through [`this link`](/?body=query{truth}).

<div id="target"></div>

### Public methods <var>static</var>

- `setup(schemas, container)` &mdash; Returns a middleware ready to be mounted into the server instance. Given `schemas` are expected to be an array of `*.gql` files and `container` is the implementation.

### Private* methods <var>static</var>

- `_startGraphQLServer(typeDefs, resolvers)` &mdash; Used by `setup()` to build the GraphQL middleware.
- `_bindGraphQLServer(schemas, container)` &mdash; Used by `setup()` to decorate the given resolvers.
