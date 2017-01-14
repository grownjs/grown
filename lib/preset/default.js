'use strict';

/* eslint-disable global-require */

module.exports = ($, opts, plugs) => {
  $.use(plugs.models(opts.appDir, __dirname));
  $.use(plugs.render(opts.srcDir, __dirname));
  $.use(plugs.router(opts.appDir, __dirname));

  $.use(plugs.logger(opts.logger || { transports: [{ Console: { colorize: true } }] }));
  $.use(plugs.session(opts.session || { secret: String(Math.random() * 101 | 0) }));

  /* istanbul ignore else */
  if (opts.bodyParser !== false) {
    $.mount('body-parser-urlEncoded', require('./middlewares/bodyParserURL')(opts));
    $.mount('body-parser-json', require('./middlewares/bodyParserJSON')());
  }

  $.mount('csrf', require('./middlewares/CSRF')());
  $.mount('no-cache', require('./middlewares/noCache')());
  $.mount('x-responseLog', require('./middlewares/xResponseLog')(opts));
  $.mount('method-override', require('./middlewares/methodOverride')());

  /* istanbul ignore else */
  if (opts.uploadDir || opts.uploads) {
    $.use(plugs.upload(opts.uploads || { cwd: opts.uploadDir }));
  }
};
