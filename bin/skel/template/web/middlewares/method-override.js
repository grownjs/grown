'use strict';

module.exports = function methodOverride(conn) {
  const _method = conn.query_params._method || conn.body_params._method
    || conn.req_headers['x-method-override']
    || conn.req_headers['x-http-method']
    || conn.req_headers['x-http-method-override'];

  if (_method) {
    conn.req.originalMethod = conn.req.method;
    conn.req.method = _method.toUpperCase();

    conn.req.url = conn.req.url
      .replace(/([&?])_method=\w+&?/g, 'conn1');

    delete conn.req.body._method;
  }
};
