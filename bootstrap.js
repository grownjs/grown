'use strict';

const util = require('./lib/util');

let $;

try {
  $ = require('wargs')(process.argv.slice(2), {
    booleans: 'qdV',
    aliases: {
      e: 'env',
      q: 'quiet',
      d: 'debug',
      V: 'verbose',
    },
  });
} catch (e) {
  util.printError(e);
  util.die(1);
}

process.name = 'grown';

if ($.flags.env === true) {
  $.flags.env = '';
}

process.env.NODE_ENV = process.env.NODE_ENV || $.flags.env || 'development';

/* istanbul ignore else */
if (process.env.CI && process.env.NODE_ENV === 'testing') {
  process.env.NODE_ENV = 'ci';
}

delete $.flags.env;

const _level = ($.flags.verbose && 'verbose') || $.flags.debug ? 'debug' : 'info';

const logger = require('log-pose')
  .setLevel($.flags.quiet ? false : _level)
  .getLogger(12, process.stdout, process.stderr);

/* istanbul ignore else */
if ($.flags.debug && $.flags.verbose) {
  require('debug').enable('json-schema-sequelizer,json-schema-sequelizer:*,grown,grown:*');
  require('log-pose').setLevel(false);
}

const IS_DEV = process.env.NODE_ENV === 'development';

const PROTOCOL = process.env.PROTOCOL || 'http';

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || '8080';

/* istanbul ignore else */
if (IS_DEV) {
  require('source-map-support').install();
}

module.exports = main => {
  const app = require(main);

  process.on('SIGINT', () =>
    app.teardown(() => process.exit()));

  return function _startApplication(done) {
    let _app;
    let _closing;

    function close(cb) {
      _closing = true;

      return _app.stop(() => {
        _closing = false;
        cb();
      });
    }

    logger('Initializing framework', () => {
      try {
        _app = app();
        _app.on('reload', () => {
          if (!_closing) {
            close(() => setTimeout(_startApplication, 100));
          }
        });
      } catch (e) {
        util.printError(e, $.flags, logger);
        util.die(1);
      }
    });

    logger('Starting server', () => {
      _app.run(() =>
        _app.listen(`${PROTOCOL}://${HOST}:${PORT}`).then(ctx => {
          logger.info('{% ok Server is ready %}\n');
          logger.info('{% link %s %}\n', ctx.location.href);

          /* istanbul ignore else */
          if (typeof done === 'function') {
            return done(_app, ctx);
          }
        }))
        .catch(e => {
          util.printError(e, $.flags, logger);
          util.die(1);
        });
    });

    return close;
  };
};
