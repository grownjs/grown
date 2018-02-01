'use strict';

module.exports = (Grown, util) => {
  const graphqlizer = require('graphqlizer');

  return Grown('GraphQL', {
    builder(resolver) {
      return graphqlizer(resolver);
    },
  });
};
