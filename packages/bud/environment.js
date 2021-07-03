'use strict';

const RE_UPPER = /^[A-Z][A-Z_]*$/;

module.exports = argv => {
  process.env.NODE_ENV = argv.flags.env || process.env.NODE_ENV || 'development';

  Object.keys(argv.data).forEach(key => {
    /* istanbul ignore else */
    if (RE_UPPER.test(key)) {
      process.env[key] = argv.data[key];
    }
  });

  delete argv.flags.env;

  /* istanbul ignore else */
  if (argv.flags.debug && argv.flags.verbose) {
    require('debug').enable('*');
  }
};
