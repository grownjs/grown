'use strict';

/* eslint-disable global-require */

module.exports = (opts) =>
  require('body-parser').urlencoded(opts.bodyParser || { extended: false });
