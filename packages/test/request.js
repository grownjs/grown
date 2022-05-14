'use strict';

const debug = require('debug')('grown:test');

const path = require('path');
const fs = require('fs');

module.exports = Grown => {
  function _fixRequest(url, method, options) {
    options = options || {};
    options.url = url || options.url || '/';
    options.method = (method || options.method || 'get').toUpperCase();
    options.headers = options.headers || {};

    if (options.headers['content-type']) {
      options.body = options.body || '';

      if (options.body && typeof options.body === 'object' && options.headers['content-type'] === 'multipart/form-data') {
        const _boundary = Math.random().toString(36);

        options.headers['content-type'] = `multipart/form-data; boundary=${_boundary}`;

        const _input = Object.keys(options.body).map(key => ({ key, value: options.body[key] }))
          .concat((options.attachments || []).map(file => ({ key: file.name, value: file.path, upload: true })));

        options.body = _input.map(field => {
          if (field.upload) {
            const filename = path.basename(field.value);

            return Buffer.concat([
              Buffer.from(`--${_boundary}\r\nContent-Disposition: form-data; name="${field.key}"; filename="${filename}"\r\n`, 'ascii'),
              Buffer.from(`Content-Type: ${field.type || 'binary/octet-stream'}\r\n\r\n`, 'ascii'),
              Buffer.from(fs.readFileSync(field.value), 'ascii'),
            ]);
          }

          return Buffer.from(`--${_boundary}\r\nContent-Disposition: form-data; name="${field.key}"\r\n\r\n${
            typeof field.value === 'object' ? JSON.stringify(field.value) : field.value
          }`, 'ascii');
        }).join('\r\n');

        options.body += `\r\n--${_boundary}--`;
      }

      if (options.body && !Buffer.isBuffer(options.body) && options.headers['content-type'] === 'application/json') {
        options.body = Buffer.from(typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body);
      }

      if (options.body) {
        options.headers['content-length'] = options.body.length;
      }
    }

    return options;
  }

  return Grown('Test.Request', {
    // export heleprs
    _fixRequest,

    $install(ctx) {
      return {
        methods: {
          request(url, method, options, callback) {
            if (typeof url === 'function') {
              callback = url;
              url = undefined;
            }

            if (typeof url === 'object') {
              options = url;
              url = undefined;
            }

            if (typeof method === 'function') {
              callback = method;
              method = undefined;
            }

            if (typeof method === 'object') {
              callback = options;
              options = method;
              method = options.method || 'GET';
            }

            if (typeof options === 'function') {
              callback = options;
              options = undefined;
            }

            if (typeof callback !== 'function') {
              throw new Error(`Expecting a function, given '${JSON.stringify(callback)}'`);
            }

            options = this._fixRequest(url, method, options);

            debug('#%s Request %s %s', process.pid, (method || 'GET').toUpperCase(), options.url);

            return ctx.run(options, callback);
          },
        },
      };
    },
  });
};
