'use strict';

module.exports = (Grown, util) => {
  const Logger = require('log-pose');
  const _utils = require('log-pose/lib/utils.js');

  // setup logger
  let _level = 'info';

  /* istanbul ignore else */
  if (Grown.argv.flags.debug) {
    _level = 'debug';
  }

  const _logger = Logger
    .setLevel(Grown.argv.flags.quiet ? false : _level)
    .getLogger(12, process.stdout, process.stderr);

  /* istanbul ignore else */
  if (Grown.argv.flags.debug && Grown.argv.flags.verbose) {
    require('debug').enable('*');
    Logger.setLevel(false);
  }

  function _elapsedTime(ctx) {
    return _utils.timeDiff(ctx._startTime);
  }

  function _errorLog(text) {
    _logger.printf('\r\r{% error %s %}\n', text);
  }

  function _msgLog(text) {
    if (text.charAt() === '-') {
      _logger.printf('\r\r{% item %s %}\n', text.substr(1).trim());
    } else if (text.indexOf('read ') === 0 || text.indexOf('write ') === 0) {
      _logger(text.split(' ').shift(1), text.split(' ').slice(1).join(' '));
    } else {
      _logger.printf('\r\r{% log %s %}\n', text);
    }
  }

  return Grown('Logger', util.extendValues({
    _elapsedTime,
    _errorLog,
    _msgLog,

    $before_render(ctx, template) {
      /* istanbul ignore else */
      if (!ctx.res.headerSent) {
        this.$before_send(null, ctx);
      }

      if (template.contents.indexOf('{elapsed}') === -1) {
        template.contents += `<p>&mdash; ${this._elapsedTime(ctx)}</p>`;
      } else {
        template.contents = template.contents.replace(/\{elapsed\}/g, this._elapsedTime(ctx));
      }
    },

    $before_send(e, ctx) {
      if (typeof ctx.end === 'function') {
        ctx.put_resp_header('X-Response-Time', this._elapsedTime(ctx));
      } else if (ctx.res) {
        ctx.res.setHeader('X-Response-Time', this._elapsedTime(ctx));
      }
    },

    $install(ctx) {
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

      return this.$mixins();
    },

    $mixins() {
      return {
        props: {
          logger: () => _logger,
        },
      };
    },

    message(log) {
      this._msgLog(log);
    },

    error(log) {
      this._errorLog(log);
    },
  }, Logger));
};
