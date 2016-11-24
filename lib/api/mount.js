'use strict';

const buildFactory = require('../factory');

module.exports = (container) => {
  container._context.mount = (callback) => {
    container.pipeline.push(buildFactory(callback, container.options, 'mount'));

    return container._context;
  };
};
