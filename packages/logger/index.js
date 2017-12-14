'use strict';

module.exports = (Grown, util) => {
  const Logger = require('log-pose');
  const _utils = require('log-pose/lib/utils.js');

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
    install(ctx) {
      ctx.on('request', conn => {
        conn._startTime = new Date();
      });

      ctx.on('finished', conn => {
        const time = _utils.timeDiff(conn._startTime);
        const code = conn.res.statusCode;
        const method = conn.req.method;
        const url = conn.req.url;

        _logger.printf('{% green %s %} %s {% yellow %s %} {% gray (%s) %}\r\n', method, url, code, time);
      });

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
