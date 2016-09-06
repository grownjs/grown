'use strict';

const buildFactory = require('../factory');

module.exports = (context, container) => {
  context.mount = (callback) => {
    container.pipeline.push(buildFactory(callback, container.options, 'mount'));

    return context;
  };
};
