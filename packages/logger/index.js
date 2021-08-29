'use strict';

module.exports = (Grown, util) => {
  const Logger = require('log-pose');
  const _utils = require('log-pose/lib/utils.js');

  // setup logger
  let _level = 'info';

  /* istanbul ignore next */
  if (Grown.argv.flags.debug) {
    _level = 'debug';
  }

  /* istanbul ignore next */
  let _logger = Logger
    .setLevel(Grown.argv.flags.quiet ? false : _level)
    .getLogger(12, process.stdout, process.stderr);

  /* istanbul ignore next */
  if (Grown.argv.flags.debug && Grown.argv.flags.verbose) {
    require('debug').enable('*');
    Logger.setLevel(false);
  }

  function _elapsedTime(ctx) {
    return _utils.timeDiff(ctx._startTime);
  }

  function _errorLog(...args) {
    _logger.printf('\r{%red. %s%}\n', args.join(''));
  }

  function _msgLog(text, ...args) {
    _logger.printf(`\r${text}\n`, ...args);
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
      } else {
        ctx.res.setHeader('X-Response-Time', this._elapsedTime(ctx));
      }
    },

    $install(ctx) {
      ctx.on('request', conn => {
        util.hiddenProperty(conn, '_startTime', new Date());
      });

      ctx.on('finished', conn => {
        const time = this._elapsedTime(conn);
        const guid = conn.req.guid || '-';
        const code = conn.res.statusCode;
        const method = conn.req.method;
        const url = conn.req.url;

        if (typeof this.filter === 'function' && this.filter(conn.req) === false) return;

        let prefix;
        if (conn.req.originalUrl) {
          prefix = conn.req.url !== '/' ? conn.req.originalUrl.substr(0, conn.req.originalUrl.length - conn.req.url.length) : conn.req.originalUrl;
        }

        let color = 'red';
        if (code < 500) color = 'yellow';
        if (code < 400) color = 'green';

        let msg;
        if (prefix && prefix !== '/') {
          const base = conn.req.baseUrl && !prefix.includes(conn.req.baseUrl) ? conn.req.baseUrl : '';

          msg = `\r{% bold %s %} {% blue. %s %}{% blueBright. %s %} {% gray. %s %} {% ${color} %s %} {% magenta (%s) %}\n`;
          _logger.debug(msg, method, base + prefix.replace(/\/$/, ''), url, guid, code, time);
        } else {
          msg = `\r{% bold %s %} {% blueBright. %s %} {% gray. %s %} {% ${color} %s %} {% magenta (%s) %}\n`;
          _logger.debug(msg, method, url, guid, code, time);
        }
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

    setLogger(stdout) {
      _logger = Logger.setLogger(stdout).getLogger(12);
    },

    message(...args) {
      this._msgLog(...args);
    },

    error(...args) {
      this._errorLog(...args);
    },
  }, Logger));
};
