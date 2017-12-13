'use strict';

module.exports = (Grown, util) => {
  const Logger = require('log-pose');

  // setup logger
  let _level = 'info';

  /* istanbul ignore else */
  if (Grown.argv.flags.verbose) {
    _level = 'verbose';
  }

  /* istanbul ignore else */
  if (Grown.argv.flags.debug) {
    _level = 'debug';
  }

  const _logger = Logger
    .setLevel(Grown.argv.flags.quiet ? false : _level)
    .getLogger(12, process.stdout, process.stderr);

  return Grown.module('Logger', util.extendValues({
    install() {
      return this.mixins();
    },
    mixins() {
      return {
        props: {
          logger: () => _logger,
        },
      };
    },
  }, Logger));
};
