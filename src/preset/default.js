/* eslint-disable global-require */

export default ($, { opts, plugs }) => {
  /* istanbul ignore else */
  if (opts.logger !== false) {
    $.ctx.use(plugs.logger(opts.logger || { transports: [{ Console: { colorize: true } }] }));
  }

  /* istanbul ignore else */
  if (opts.bodyParser !== false) {
    $.ctx.mount('body-parser', require('./middlewares/bodyParserURL')(opts));
    $.ctx.mount('body-parser-json', require('./middlewares/bodyParserJSON')());
  }

  /* istanbul ignore else */
  if (opts.methodOverride !== false) {
    $.ctx.mount('method-override', require('./middlewares/methodOverride')());
  }

  /* istanbul ignore else */
  if (opts.noCache !== false) {
    $.ctx.mount('no-cache', require('./middlewares/noCache')());
  }

  /* istanbul ignore else */
  if (opts.xLog !== false) {
    $.ctx.mount('x-log', require('./middlewares/xResponseTime')(opts));
  }

  // models
  $.ctx.use(plugs.models(opts.appDir, __dirname));

  // views
  $.ctx.use(plugs.render(opts.srcDir, __dirname));

  // controllers
  $.ctx.use(plugs.router(opts.appDir, __dirname));

  /* istanbul ignore else */
  if (opts.uploadDir || opts.uploads) {
    $.ctx.use(plugs.upload(opts.uploads || { cwd: opts.uploadDir }));
  }

  /* istanbul ignore else */
  if (opts.session !== false) {
    $.ctx.use(plugs.session(opts.session || { secret: String(Math.random() * 101 | 0) }));
  }
};
