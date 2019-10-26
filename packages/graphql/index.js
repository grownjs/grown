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
      const data = body.variables || query.data || {};

      ctx.res.setHeader('Content-Type', 'application/json');

      /* istanbul ignore else */
      if (!_query) {
        ctx.res.statusCode = 422;
        return ctx.res.end('{"errors":["Missing input body or query"]}');
      }

      return gql.graphql(_schema, _query, null, ctx, data)
        .then(result => {
          /* istanbul ignore else */
          if (result.errors && result.errors.length > 0) {
            ctx.res.statusCode = ctx.res.statusCode !== 200 ? ctx.res.statusCode : 400;

            result.errors.forEach(e => {
              e.message = e.message.replace(/^\d+ [_A-Z]+: /, '');
              e.description = e.stack.toString();
            });
          }

          ctx.res.end(JSON.stringify(result));
        });
    };
  }

  function _bindGraphQLServer(schemas, container) {
    /* istanbul ignore else */
    if (!(schemas && Array.isArray(schemas))) {
      throw new Error('Missing or invalid schemas');
    }

    const typeDefs = schemas.map(file => {
      try {
        return fs.readFileSync(file, 'utf8');
      } catch (e) {
        throw new Error(`Unable to load schema, given '${file}'`);
      }
    });

    /* istanbul ignore else */
    if (!(container && container.registry)) {
      throw new Error('Missing or invalid container');
    }

    const resolvers = {};

    Object.keys(container.registry).forEach(name => {
      const target = container.get(name);

      ['Mutation', 'Query'].forEach(method => {
        Object.keys(target[method] || {}).forEach(prop => {
          /* istanbul ignore else */
          if (typeof target[method][prop] !== 'function') {
            throw new Error(`Expecting ${prop} to be a function, given '${target[method][prop]}'`);
          }

          resolvers[method] = resolvers[method] || {};
          resolvers[method][prop] = function $call(root, args, { req }) {
            return Promise.resolve()
              .then(() => target[method][prop]({ root, args, req }))
              .catch(error => {
                error = util.cleanError(error, Grown.cwd);

                throw error;
              });
          };
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
