'use strict';

module.exports = (container) => {
  container.context.use = (cb) => {
    cb(container.contet);

    return container.context;
  };
};
