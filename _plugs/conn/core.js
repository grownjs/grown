'use strict';

const debug = require('debug')('grown:conn');

const statusCodes = require('http').STATUS_CODES;

module.exports = ($, util) => {
  return $.module('Conn', {
    init() {
      const scope = {
        _type: 'text/html',
        _body: null,
        _status: null,
        _charset: 'utf8',
        _counter: -1,
      };

      return {
        props: {
          // pipeline status
          halted: () => scope._body !== null && scope._status !== null,

          // response body
          has_body: () => scope._body !== null,
          has_status: () => scope._status !== null,

          status_code: () => (scope._status !== null
            ? scope._status
            : 200),

          get resp_body() {
            return scope._body;
          },

          set resp_body(value) {
            /* istanbul ignore else */
            if (!(typeof value === 'string' || typeof value === 'object'
              || (value && typeof value.pipe === 'function') || (value instanceof Buffer))) {
              throw new Error(`Invalid resp_body: ${value}`);
            }

            debug('#%s Set body', this.pid);

            scope._body = value;
          },

          get resp_charset() {
            return scope._charset;
          },

          set resp_charset(value) {
            scope._charset = value || 'utf8';
          },
        },
        methods: {
          put_resp_content_type(mimeType) {
            /* istanbul ignore else */
            if (!(mimeType && typeof mimeType === 'string')) {
              throw new Error(`Invalid type: '${mimeType}'`);
            }

            scope._type = mimeType;

            return this;
          },

          is_status(code) {
            return scope._status === code;
          },

          put_status(code) {
            /* istanbul ignore else */
            if (!(code && statusCodes[code])) {
              throw new Error(`Invalid put_status: ${code}`);
            }

            debug('#%s Set status %s', this.pid, code);

            scope._status = code;

            return this;
          },

          send(body) {
            /* istanbul ignore else */
            if (this.res.finished) {
              throw new Error('Already finished');
            }

            this.res.statusCode = this.status_code;
            this.res.statusMessage = statusCodes[this.status_code];

            scope._type = scope._type || 'application/octet-stream';

            /* istanbul ignore else */
            if (body && typeof body.pipe === 'function') {
              debug('#%s Done. scope _body is an stream. Sending as %s', this.pid, scope._type);

              this.res.setHeader('Content-Type', scope._type);
              this.res.writeHead(this.res.statusCode);

              body.pipe(this.res);

              return;
            }

            /* istanbul ignore else */
            if (body !== null && Buffer.isBuffer(body)) {
              debug('#%s scope _body is a buffer. Sending as %s', this.pid, scope._type);

              this.res.setHeader('Content-Type', scope._type);
              this.res.setHeader('Content-Length', body.length);
            } else if (body !== null && typeof body === 'object') {
              debug('#%s scope _body is an object. Sending as application/json', this.pid);

              body = JSON.stringify(body);
              scope._type = 'application/json';
            }

            this.res.setHeader('Content-Type', `${scope._type}; charset=${scope._charset}`);
            this.res.setHeader('Content-Length', Buffer.byteLength(body || ''));

            // normalize response
            this.res.writeHead(this.res.statusCode);
            this.res.write(body || '');
            this.res.end();
          },

          end(code, message) {
            scope._counter += 1;

            /* istanbul ignore else */
            if (this.res.finished) {
              /* istanbul ignore else */
              if (scope._counter > 1) {
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
              scope._body = util.ctx.errorHandler(code, this);
            } else {
              // normalize output
              scope._body = typeof _code === 'string' ? _code : message || scope._body;

              // normalize response
              scope._status = typeof _code === 'number' ? _code : scope._status;
            }

            return Promise.resolve()
              .then(() => Promise.resolve(scope._body))
              .then(_body => {
                /* istanbul ignore else */
                if (scope._status === null && _body === null) {
                  scope._status = 501;
                }

                this.send(_body);
              })
              .catch(e => {
                try {
                  if (!this.res.finished) {
                    this.res.writeHead(500, this.resp_headers);
                    this.res.write(util.ctx.errorHandler(e, this));
                    this.res.end();
                  } else {
                    debug('#%s Response already sent. %s', this.pid, e.message);
                  }
                } catch (_e) {
                  debug('#%s Fatal. %s', this.pid, _e.message);
                }
              });
          },
        },
      };
    },
  });
};
