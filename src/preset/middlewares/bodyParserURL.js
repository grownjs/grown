/* eslint-disable global-require */

export default (opts) =>
  require('body-parser').urlencoded(opts.bodyParser || { extended: false });
