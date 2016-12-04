'use strict';

module.exports = (container) => {
  container._context.use = (cb) => {
    const task = cb(container);

    if (task) {
      container.initializers.push(task);
    }

    return container._context;
  };
};
