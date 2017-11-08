'use strict';

const debug = require('debug')('grown:conn');

const errorHandler = require('./lib/util/error');
const util = require('./lib/util');

const statusCodes = require('http').STATUS_CODES;

function fail(e) {
  try {
    if (!this.res.finished) {
      this.res.writeHead(500, this.resp_headers);
      this.res.write(errorHandler(e, this, !this.is_xhr, this.options));
      this.res.end();
    } else {
      debug('#%s Response already sent', this.pid);
    }
  } catch (_e) {
    debug('#%s Fatal. %s', this.pid, _e.message);
  }
}

module.exports = {
  init() {
    const _resp = {
      type: 'text/html',
      state: {},
      counter: -1,
      body: null,
      status: null,
      charset: 'utf8',
      environment: {},
    };

    return {
      props: {
        // pipeline status
        halted: () => _resp.body !== null && _resp.status !== null,

        // response body
        has_body: () => _resp.body !== null,
        has_status: () => _resp.status !== null,

        status_code: () => (_resp.status !== null
          ? _resp.status
          : 200),

        // shared
        get state() {
          return _resp.state;
        },

        set state(value) {
          _resp.state = value || {};
        },

        get resp_body() {
          return _resp.body;
        },

        set resp_body(value) {
          /* istanbul ignore else */
          if (!(typeof value === 'string' || typeof value === 'object'
            || (value && typeof value.pipe === 'function') || (value instanceof Buffer))) {
            throw new Error(`Invalid resp_body: ${value}`);
          }

          debug('#%s Set body', this.pid);

          _resp.body = value;
        },

        get resp_charset() {
          return _resp.charset;
        },

        set resp_charset(value) {
          _resp.charset = value || 'utf8';
        },
      },
      methods: {
        put_resp_content_type(mimeType) {
          /* istanbul ignore else */
          if (!(mimeType && typeof mimeType === 'string')) {
            throw new Error(`Invalid type: '${mimeType}'`);
          }

          _resp.type = mimeType;

          return this;
        },

        set_state(name, value) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid set_state: '${name}' => '${value}'`);
          }

          util.set(_resp.state, name, value);

          return this;
        },

        merge_state(values) {
          /* istanbul ignore else */
          if (!(values && (typeof values === 'object' && !Array.isArray(values)))) {
            throw new Error(`Invalid merge_state: '${values}'`);
          }

          Object.keys(values).forEach(key => {
            this.set_state(key, values[key]);
          });

          return this;
        },

        is_status(code) {
          return _resp.status === code;
        },

        put_status(code) {
          /* istanbul ignore else */
          if (!(code && statusCodes[code])) {
            throw new Error(`Invalid put_status: ${code}`);
          }

          debug('#%s Set status %s', this.pid, code);

          _resp.status = code;

          return this;
        },

        send(body) {
          /* istanbul ignore else */
          if (this.res.finished) {
            throw new Error('Already finished');
          }

          this.res.statusCode = this.status_code;
          this.res.statusMessage = statusCodes[this.status_code];

          _resp.type = _resp.type || 'application/octet-stream';

          /* istanbul ignore else */
          if (body && typeof body.pipe === 'function') {
            debug('#%s Done. Response body is an stream. Sending as %s', this.pid, _resp.type);

            this.res.setHeader('Content-Type', _resp.type);
            this.res.writeHead(this.res.statusCode);

            body.pipe(this.res);

            return;
          }

          /* istanbul ignore else */
          if (body !== null && Buffer.isBuffer(body)) {
            debug('#%s Response body is a buffer. Sending as %s', this.pid, _resp.type);

            this.res.setHeader('Content-Type', _resp.type);
            this.res.setHeader('Content-Length', body.length);
          } else if (body !== null && typeof body === 'object') {
            debug('#%s Response body is an object. Sending as application/json', this.pid);

            body = JSON.stringify(body);
            _resp.type = 'application/json';
          }

          this.res.setHeader('Content-Type', `${_resp.type}; charset=${_resp.charset}`);
          this.res.setHeader('Content-Length', Buffer.byteLength(body || ''));

          // normalize response
          this.res.writeHead(this.res.statusCode);
          this.res.write(body || '');
          this.res.end();
        },

        end(code, message) {
          _resp.counter += 1;

          /* istanbul ignore else */
          if (this.res.finished) {
            /* istanbul ignore else */
            if (_resp.counter > 1) {
              throw new Error('Already finished');
            }
            return;
          }

          let _code = code;

          /* istanbul ignore else */
          if (typeof code === 'string' || code instanceof Buffer) {
            message = code;
            _code = 200;
          }

          if (code instanceof Error) {
            _resp.body = errorHandler(code, this, !this.is_xhr, this.options);
          } else {
            // normalize output
            _resp.body = typeof _code === 'string' ? _code : message || _resp.body;

            // normalize response
            _resp.status = typeof _code === 'number' ? _code : _resp.status;
          }

          return Promise.resolve()
            .then(() => Promise.resolve(_resp.body))
            .then(_body => {
              /* istanbul ignore else */
              if (_resp.status === null && _body === null) {
                _resp.status = 501;
              }

              this.send(_body);
            })
            .catch(e => fail.call(this, e));
        },
      },
    };
  },
};
