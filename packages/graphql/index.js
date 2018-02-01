'use strict';

module.exports = (Grown, util) => {
  const graphqlSequelizer = require('graphql-sequelizer');

  return Grown('GraphQL', {
    builder(resolver) {
      return graphqlSequelizer(resolver);
    },
  });
};
