'use strict';

// const { Resolver } = require('sastre');

// const fs = require('fs');
// const path = require('path');

// class GraphQLResolver {
//   constructor(container, { directory }) {
//     this.repository = new Resolver(container, directory);
//   }

//   static startGraphQLServer(app, prefix, typeDefs, resolvers) {
//     const gql = require('graphql');
//     const gqltools = require('graphql-tools');

//     const _schema = gqltools.makeExecutableSchema({ typeDefs, resolvers });

//     app.use(prefix, (req, res, next) => {
//       const query = req.body.query || req.query.body;
//       const data = req.body.variables || req.query.data;

//       gql.graphql(_schema, query, null, { req }, data)
//         .then(response => {
//           res.json(response);
//         })
//         .catch(next);
//     });
//   }

//   use(app, prefix) {
//     const schemaCommon = path.resolve(__dirname, '../../../schema/common.gql');
//     const schemaIndex = path.resolve(__dirname, '../../../schema/generated/index.gql');

//     const typeDefs = [
//       schemaCommon,
//       schemaIndex,
//     ].map(file => fs.readFileSync(file, 'utf8'));

//     const resolvers = {
//       Mutation: {},
//       Query: {},
//     };

//     Object.keys(this.repository.registry).forEach(name => {
//       const target = this.repository.get(name);

//       Object.keys(resolvers).forEach(method => {
//         Object.keys(target[method] || {}).forEach(prop => {
//           if (typeof target[method][prop] === 'function') {
//             resolvers[method][prop] = async function call(root, args, { req }) {
//               log.info(`${name}.${prop} <-`, { request: args }, req.guid);

//               try {
//                 const response = await target[method][prop]({ root, args, req });

//                 log.info(`${name}.${prop}`, { response }, req.guid);

//                 return response;
//               } catch (error) {
//                 log.exception(error.originalError || error, `${name}.${prop}`, null, req.guid);

//                 const _err = error.originalError || error;

//                 if (_err instanceof Error) {
//                   throw _err;
//                 }

//                 if (!(_err.original && _err.original.errno)) {
//                   throw new Error(_err.description || _err.message);
//                 }

//                 throw new Error(`${_err.description || _err.message} (${_err.original.errno})`);
//               }
//             };
//           }
//         });
//       });
//     });

//     GraphQLResolver.startGraphQLServer(app, prefix, typeDefs, resolvers);
//   }

//   get(name) {
//     try {
//       return this.repository.get(name);
//     } catch (e) {
//       throw new Error(`Unable to load graphql-handler for '${name}'. ${e.message || e.toString()}`);
//     }
//   }
// }

// module.exports = GraphQLResolver;


module.exports = Grown => {
  // const graphqlizer = require('graphqlizer');

  return Grown('GraphQL', {
    // builder(resolver) {
    //   return graphqlizer(resolver);
    // },
  });
};
