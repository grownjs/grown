const _env = require('dotenv');

export default ($) => {
  $.ctx.configure = _opts => _env.config(_opts || { silent: true });
};
