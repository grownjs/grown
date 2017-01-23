'use strict';

/* eslint-disable global-require */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const IS_DEBUG = process.argv.indexOf('--debug') > -1;
const IS_REPL = process.argv.indexOf('--repl') > -1;
const IS_DEV = process.env.NODE_ENV === 'dev';

/* istanbul ignore else */
if (IS_DEBUG) {
  require('debug').enable('homegrown,homegrown:*');
}

/* istanbul ignore else */
if (IS_DEV) {
  require('source-map-support').install();
}

// common helpers
const _ = require('./_util');

// initialization
let $;

const cwd = process.cwd();
const path = require('path');
const chalk = require('chalk');
const cleanStack = require('clean-stack');
const thisPkg = require('../../package.json');

const _name = chalk.green(`${thisPkg.name} v${thisPkg.version}`);
const _node = chalk.gray(`node ${process.version}`);

_.echo(`${_name} ${_node}\n`);

// after if debug
const _repl = require('./_repl');
const homegrown = require('../..');

// setup environment
homegrown.env(cwd);

function _startServer(done) {
  // start server
  $.listen(process.env.PORT || 8080, (app) => {
    _.echo(chalk.gray('› Listening at '), chalk.yellow(app.location.href), '\n');

    /* istanbul ignore else */
    if (typeof done === 'function') {
      done($, app);
    }
  });
}

function _startApplication(done) {
  try {
    // reset context
    const Homegrown = homegrown();

    $ = Homegrown.new({
      env: process.env.NODE_ENV || 'dev',
      appDir: path.resolve(cwd, process.env.APP_DIR || 'app'),
      publicDir: path.resolve(cwd, process.env.PUBLIC_DIR || 'public'),
      session: {
        secret: process.env.SESSION_SECRET || 'secret*value',
        keys: (process.env.SESSION_KEYS || 'secret*value').split(/\s+/),
        maxAge: parseInt(process.env.SESSION_MAXAGE || 0, 10) || 86400000,
      },
      upload: {
        multiple: _.toBool(process.env.UPLOAD_MULTIPLE) || true,
        maxFiles: parseInt(process.env.UPLOAD_MAXFILES, 0) || 10,
      },
      logger: {
        format: process.env.LOGGER_FORMAT || 'dev',
        chalkize: _.toBool(process.env.LOGGER_COLORIZE) || true,
      },
    });

    // import native support
    $.extensions('Homegrown.conn.http', () => require('http'));

    // log as soon as possible
    $.mount(require('morgan')($.get('logger.format')));

    // try static handler first
    $.mount(require('serve-static')($.get('publicDir')));

    // inject logging helpers
    $.use(homegrown.plugs.logger({
      transports: [{
        Console: {
          chalkize: $.get('logger.chalkize'),
        },
      }],
    }));

    // standard mvc kit
    $.use(homegrown.plugs.models($.get('appDir'), path.join(__dirname, '_preset')));
    $.use(homegrown.plugs.render($.get('appDir'), path.join(__dirname, '_preset')));
    $.use(homegrown.plugs.router($.get('appDir'), path.join(__dirname, '_preset')));

    $.mount(require('body-parser').json());
    $.mount(require('body-parser').urlencoded({ extended: false }));

    // built-in method-override
    $.mount('_method', (conn) => {
      const _method = conn.query_params._method || conn.body_params._method
        || conn.req_headers['x-method-override']
        || conn.req_headers['x-http-method']
        || conn.req_headers['x-http-method-override'];

      /* istanbul ignore else */
      if (_method) {
        conn.req.originalMethod = conn.req.method;
        conn.req.method = _method.toUpperCase();

        // remove _method from query
        conn.req.url = conn.req.url
          .replace(/([&?])_method=\w+&?/g, '$1');

        // remove _method from body
        delete conn.req.body._method;
      }
    });

    $.use(homegrown.plugs.upload($.get('upload')));
    $.use(homegrown.plugs.session($.get('session')));

    if (IS_REPL) {
      const _close = _repl($);

      $.on('close', () => _close());
    }

    _startServer(done);
  } catch (e) {
    _.echo(chalk.red((IS_DEBUG && cleanStack(e.stack)) || e.message), '\n');
    _.die(1);
  }
}

_startApplication();

function _reload(cb) {
  return homegrown.burn(() => {
    _.clearModules();
    _startApplication(cb);
  });
}

if (IS_REPL) {
  process.on('repl:reload', () => _reload());
} else {
  process.on('exit', () => homegrown.burn());
  process.on('SIGINT', () => process.exit());
}

// teardown
module.exports = cb => _reload(cb);
