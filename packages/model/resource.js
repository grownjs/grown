'use strict';

module.exports = Grown => {
  const formator = require('formator');

  return Grown('Model.Resource', {
    bind(db, options) {
      return formator(db, {
        attributes: false,
        ...options,
      });
    },
  });
};
