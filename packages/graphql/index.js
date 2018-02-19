'use strict';

module.exports = Grown => {
  const graphqlizer = require('graphqlizer');

  return Grown('GraphQL', {
    builder(resolver) {
      return graphqlizer(resolver);
    },
  });
};
