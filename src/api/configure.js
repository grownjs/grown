const _env = require('dotenv');

module.exports = ($) => {
  $.ctx.configure = _opts => _env.config(_opts || { silent: true });
};
