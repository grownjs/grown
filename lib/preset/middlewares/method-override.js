'use strict';

module.exports = () => {
  return function methodOverride(conn) {
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
  };
};
