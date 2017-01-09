/* eslint-disable global-require */

export default ($, { opts, plugs }) => {
  const bodyParser = require('body-parser');

  // attach logger
  $.ctx.use(plugs.logger(opts.logger || { transports: [{ Console: { colorize: true } }] }));

  // common middleware
  $.ctx.mount('body-parser', bodyParser.urlencoded(opts.bodyParser || { extended: false }));
  $.ctx.mount('body-parser-json', bodyParser.json());

  $.ctx.mount('_method.no-cache.log', (conn) => {
    const _method = conn.query_params._method || conn.body_params._method
      || conn.req_headers['x-method-override']
      || conn.req_headers['x-http-method']
      || conn.req_headers['x-http-method-override'];

    /* istanbul ignore else */
    if (_method) {
      // TODO: make _method configurable (on/off)
      conn.req.originalMethod = conn.req.method;
      conn.req.method = _method.toUpperCase();

      // remove _method from query
      conn.req.url = conn.req.url
        .replace(/([&?])_method=\w+&?/g, '$1');

      // remove _method from body
      delete conn.req.body._method;
    }

    const start = process.hrtime();

    conn.before_send(() => {
      const diff = process.hrtime(start);
      const time = (diff[0] * 1e3) + (diff[1] * 1e-6);

      conn.put_resp_header('X-Response-Time', `${time}ms`);

      // TODO: make no-cache configurable (on/off)
      conn.put_resp_header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      conn.put_resp_header('Expires', '-1');
      conn.put_resp_header('Pragma', 'no-cache');

      // TODO: make log configurable (on/off)
      conn.info(`${conn.method} ${conn.request_path} - Sent ${conn.res.statusCode} in ${time}ms`);
    });
  });

  // models
  $.ctx.use(plugs.models(opts.appDir));

  // views
  $.ctx.use(plugs.render(opts.srcDir));

  // controllers
  $.ctx.use(plugs.router(opts.appDir));

  /* istanbul ignore else */
  if (opts.uploadDir || opts.uploads) {
    $.ctx.use(plugs.upload(opts.uploads || { cwd: opts.uploadDir }));
  }

  // session is always loaded
  $.ctx.use(plugs.session(opts.session || { secret: String(Math.random() * 101 | 0) }));
};
