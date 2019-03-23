'use strict';

const fs = require('fs');

module.exports = (Grown, util) => {
  function _startGraphQLServer(typeDefs, resolvers) {
    const gql = require('graphql');
    const gqltools = require('graphql-tools');

    const _schema = gqltools.makeExecutableSchema({ typeDefs, resolvers });

    return ctx => {
      const body = ctx.req.body || {};
      const query = ctx.req.query || {};

      const _query = body.query || query.body;
      const data = body.variables || query.data;

      return gql.graphql(_schema, _query, null, ctx, data)
        .then(result => {
          if (result.errors && Grown.env === 'development') {
            result.errors.forEach(e => {
              e.description = e.stack.toString();
            });
          }

          ctx.res.setHeader('Content-Type', 'application/json');
          ctx.res.end(JSON.stringify(result));
        });
    };
  }

  function _bindGraphQLServer(schemas, container) {
    const typeDefs = schemas.map(file => fs.readFileSync(file, 'utf8'));

    const resolvers = {
      Mutation: {},
      Query: {},
    };

    Object.keys(container.registry).forEach(name => {
      const target = container.get(name);

      Object.keys(resolvers).forEach(method => {
        Object.keys(target[method] || {}).forEach(prop => {
          if (typeof target[method][prop] === 'function') {
            resolvers[method][prop] = function $call(root, args, { req }) {
              return Promise.resolve()
                .then(() => target[method][prop]({ root, args, req }))
                .catch(error => {
                  if (!Grown.argv.flags.debug) {
                    error = util.cleanError(error, Grown.cwd);
                  }

                  throw error;
                });
            };
          }
        });
      });
    });

    return this._startGraphQLServer(typeDefs, resolvers);
  }

  return Grown('GraphQL', {
    _startGraphQLServer,
    _bindGraphQLServer,

    setup(schemas, container) {
      return this._bindGraphQLServer(schemas, container);
    },
  });
};
