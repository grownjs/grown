'use strict';

module.exports = (container) => {
  container.context.use = (cb) => {
    cb(container);

    return container.context;
  };
};
