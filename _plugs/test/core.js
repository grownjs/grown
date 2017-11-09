'use strict';

module.exports = $ => {
  $.module('Test', {
    request(url, method, options, callback) {
      if (typeof url === 'function') {
        callback = url;
        url = undefined;
      }

      if (typeof url === 'object') {
        options = url;
        url = undefined;
      }

      if (typeof method === 'object') {
        options = method;
        method = undefined;
      }

      options = options || {};
      options.url = url || options.url || '/';
      options.method = (method || options.method || 'get').toUpperCase();
      options.headers = options.headers || {};

      // FIXME: enhance or mock this?
      const conn = {
        req: options,
      };

      return this.run(conn).then(x => callback(null, x)).catch(callback);
    },
  });
};
