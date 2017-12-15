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

  function _elapsedTime(ctx) {
    return _utils.timeDiff(ctx._startTime);
  }

  return Grown('Logger', util.extendValues({
    _elapsedTime,

    before_render(ctx, template) {
      if (template.contents.indexOf('{elapsed}') === -1) {
        template.contents += `<p>&mdash; ${this._elapsedTime(ctx)}</p>`;
      } else {
        template.contents = template.contents.replace(/\{elapsed\}/g, this._elapsedTime(ctx));
      }
    },

    before_send(e, ctx) {
      if (typeof ctx.end === 'function') {
        ctx.put_resp_header('X-Response-Time', this._elapsedTime(ctx));
      } else if (ctx.res) {
        ctx.res.setHeader('X-Response-Time', this._elapsedTime(ctx));
      }
    },

    install(ctx) {
      ctx.on('request', conn => {
        util.hiddenProperty(conn, '_startTime', new Date());
      });

      ctx.on('finished', conn => {
        const time = this._elapsedTime(conn);
        const code = conn.res.statusCode;
        const method = conn.req.method;
        const url = conn.req.url;

        _logger.debug('{% green %s %} %s {% yellow %s %} {% gray (%s) %}\r\n', method, url, code, time);
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
