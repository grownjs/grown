'use strict';

module.exports = [
  require('body-parser').json(),
  require('body-parser').urlencoded({ extended: false }),
];
