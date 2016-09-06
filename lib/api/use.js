'use strict';

module.exports = (context, container) => {
  context.use = (cb) => {
    cb(context, container);

    return context;
  };
};
