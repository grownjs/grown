/* eslint-disable global-require */

module.exports = ($, { opts, plugs }) => {
  $.ctx.use(plugs.models(opts.appDir, __dirname));
  $.ctx.use(plugs.render(opts.srcDir, __dirname));
  $.ctx.use(plugs.router(opts.appDir, __dirname));

  $.ctx.use(plugs.logger(opts.logger || { transports: [{ Console: { colorize: true } }] }));
  $.ctx.use(plugs.session(opts.session || { secret: String(Math.random() * 101 | 0) }));

  /* istanbul ignore else */
  if (opts.bodyParser !== false) {
    $.ctx.mount('body-parser-urlEncoded', require('./middlewares/bodyParserURL')(opts));
    $.ctx.mount('body-parser-json', require('./middlewares/bodyParserJSON')());
  }

  $.ctx.mount('csrf', require('./middlewares/CSRF')());
  $.ctx.mount('no-cache', require('./middlewares/noCache')());
  $.ctx.mount('x-responseLog', require('./middlewares/xResponseLog')(opts));
  $.ctx.mount('method-override', require('./middlewares/methodOverride')());

  /* istanbul ignore else */
  if (opts.uploadDir || opts.uploads) {
    $.ctx.use(plugs.upload(opts.uploads || { cwd: opts.uploadDir }));
  }
};
