'use strict';

module.exports = (container) => {
  container._context.use = (cb) => {
    cb(container);

    return container._context;
  };
};
