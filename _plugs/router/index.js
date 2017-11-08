'use strict';

module.exports = {
  get(path, cb) {
    this.mount(path, cb);
  },
};
