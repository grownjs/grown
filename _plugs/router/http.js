'use strict';

module.exports = $ => {
  $.module('Router.HTTP', {
    install() {
      console.log('SETUP HTTP METHODS');
    },
    props: {
      router: {},
    },
  });
};
