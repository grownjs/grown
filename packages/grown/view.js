const util = require('util');

module.exports = (state, h) =>
  h('pre', null, util.inspect(state));
