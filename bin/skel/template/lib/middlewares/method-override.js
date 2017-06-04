'use strict';

module.exports = () => {
  return function methodOverride($) {
    const _method = $.query_params._method || $.body_params._method
      || $.req_headers['x-method-override']
      || $.req_headers['x-http-method']
      || $.req_headers['x-http-method-override'];

    if (_method) {
      $.req.originalMethod = $.req.method;
      $.req.method = _method.toUpperCase();

      $.req.url = $.req.url
        .replace(/([&?])_method=\w+&?/g, '$1');

      delete $.req.body._method;
    }
  };
};
