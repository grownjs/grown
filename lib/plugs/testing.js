'use strict';

const debug = require('debug')('grown:test');

const path = require('path');
const fs = require('fs');

function _set(obj, k, v) {
  Object.defineProperty(obj, k, {
    get: v,
  });
}

module.exports = $ => {
  let _fn;

  const mime = require('mime');

  const MockReq = require('mock-req');
  const MockRes = require('mock-res');

  debug('Initializating test protocol');

  $.extensions('Conn.test', {
    props: {
      globalAgent: {
        defaultPort: process.env.PORT || 80,
      },
    },
    methods: {
      createServer(_options, _client) {
        /* istanbul ignore else */
        if (typeof _options === 'function') {
          _client = _options;
          _options = null;
        }

        _fn = _client;

        return { listen(port, host, callback) { callback(); } };
      },
    },
  });

  function next(req, onFinish) {
    const resp = new MockRes(() => onFinish(null, resp));

    resp.on('error', err => onFinish(err, resp));

    resp.cookies = {};
    resp.clearCookie = k => { delete resp.cookies[k]; };
    resp.cookie = (k, v, o) => { resp.cookies[k] = { value: v, opts: o || {} }; };

    const _setHeader = resp.setHeader;

    resp.setHeader = (k, v) => {
      if (k === 'set-cookie') {
        v.forEach(x => {
          const parts = x.split(';')[0].split('=');

          resp.cookies[parts[0]] = parts[1];
        });
      }

      _setHeader.call(resp, k, v);
    };

    _set(resp, 'body', () => resp._getString());
    _set(resp, 'json', () => resp._getJSON());

    // response is not empty already?
    delete resp._header;

    try {
      if (typeof _fn === 'function') {
        debug('Mocking request...');
        _fn(req, resp);
      } else {
        debug('Wait. No request');
        resp.end();
      }
    } catch (e) {
      debug('Request failed');
      onFinish(e, resp);
    }
  }

  function run(options, callback) {
    return new Promise((resolve, reject) => {
      debug('Requesting %s %s', options.method, options.url);

      try {
        // normalize body
        let _body;

        /* istanbul ignore else */
        if (options.headers['content-type']) {
          _body = options.body || '';

          delete options.body;

          // FIXME: test multipart with a proper parser

          /* istanbul ignore else */
          if (_body && typeof _body === 'object' && options.headers['content-type'] === 'multipart/form-data') {
            const _boundary = Math.random().toString(36);

            options.headers['content-type'] = `multipart/form-data; boundary=${_boundary}`;

            const _input = Object.keys(_body).map(key => ({ key, value: _body[key] }))
              .concat((options.attachments || []).map(file => ({ key: file.name, value: file.path, upload: true })));

            _body = _input.map(field => {
              /* istanbul ignore else */
              if (field.upload) {
                const filename = path.basename(field.value);

                return Buffer.concat([
                  new Buffer(`--${_boundary}\r\nContent-Disposition: form-data; name="${field.key}"; filename="${filename}"\r\n`, 'ascii'),
                  new Buffer(`Content-Type: ${mime.lookup(filename)}\r\n\r\n`, 'ascii'),
                  new Buffer(fs.readFileSync(field.value), 'ascii'),
                ]);
              }

              return new Buffer(`--${_boundary}\r\nContent-Disposition: form-data; name="${field.key}"\r\n\r\n${
                typeof field.value === 'object' ? JSON.stringify(field.value) : field.value
              }`, 'ascii');
            }).join('\r\n');

            _body += `\r\n--${_boundary}--`;
          }

          /* istanbul ignore else */
          if (_body && options.headers['content-type'] === 'application/json') {
            _body = typeof _body !== 'string' ? JSON.stringify(_body) : _body;
          }

          /* istanbul ignore else */
          if (_body) {
            options.headers['content-length'] = _body.length;
          }
        }

        const req = typeof callback === 'function'
          ? callback(new MockReq(options))
          : new MockReq(options);

        process.nextTick(() => {
          /* istanbul ignore else */
          if (_body && (Buffer.isBuffer(_body) || typeof _body === 'string')) {
            req.write(_body);
            req.end();
          }

          /* istanbul ignore else */
          if (_body && typeof _body.pipe === 'function') {
            _body.pipe(req);
          }
        });

        next(req, (err, resp) => {
          if (err) {
            debug('Error. %s', err.message);
            reject(err);
          } else {
            debug('Done. The request was ended');
            resolve(resp);
          }
        });
      } catch (e) {
        debug('Failed. %s', e.message);
        reject(e);
      }
    });
  }

  let _conn;

  return function makeRequest(url, method, options) {
    let callback;

    /* istanbul ignore else */
    if (typeof url === 'function') {
      callback = url;
      url = undefined;
    }

    /* istanbul ignore else */
    if (typeof url === 'object') {
      options = url;
      url = undefined;
    }

    /* istanbul ignore else */
    if (typeof method === 'object') {
      options = method;
      method = undefined;
    }

    options = options || {};
    options.url = url || options.url || '/';
    options.method = (method || options.method || 'get').toUpperCase();
    options.headers = options.headers || {};

    return (_conn || (_conn = $.listen('test://'))).then(_server => {
      options.headers.host = _server.location.host;

      return run(options, callback);
    });
  };
};
