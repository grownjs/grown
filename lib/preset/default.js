'use strict';

/* eslint-disable global-require */

const debug = require('debug')('homegrown');

module.exports = ($, opts, plugs) => {
  debug('Trying to load plugins: models, render, router');

  $.use(plugs.models(opts.appDir, __dirname));
  $.use(plugs.render(opts.srcDir, __dirname));
  $.use(plugs.router(opts.appDir, __dirname));

  debug('Trying to load plugins: logger, session');

  $.use(plugs.logger(opts.logger || { transports: [{ Console: { colorize: true } }] }));
  $.use(plugs.session(opts.session || { secret: String(Math.random() * 101 | 0) }));

  /* istanbul ignore else */
  if (opts.bodyParser !== false) {
    debug('Trying to mount middleware: bodyParser');

    $.mount('body-parser-urlEncoded', require('./middlewares/bodyParserURL')(opts));
    $.mount('body-parser-json', require('./middlewares/bodyParserJSON')());
  }

  debug('Trying to mount middlewares: csrf, no-cache, x-responseLog, method-override');

  $.mount('csrf', require('./middlewares/CSRF')());
  $.mount('no-cache', require('./middlewares/noCache')());
  $.mount('x-responseLog', require('./middlewares/xResponseLog')(opts));
  $.mount('method-override', require('./middlewares/methodOverride')());

  /* istanbul ignore else */
  if (opts.uploadDir || opts.uploads) {
    debug('Trying to load plugin: upload');

    $.use(plugs.upload(opts.uploads || { cwd: opts.uploadDir }));
  }
};
