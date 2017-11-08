'use strict';

module.exports = $ => {
  $.module('Router', {
    install() {
      console.log('SETUP ROUTER CORE');
    },
    get(path, cb) {
      console.log(this);
      if (this.router) {
        console.log('GET', path, cb);
      } else {
        this.mount(path, cb);
      }
    },
  });
};
