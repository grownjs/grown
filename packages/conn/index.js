'use strict';

const debug = require('debug')('grown:conn');

const statusCodes = require('http').STATUS_CODES;

module.exports = ($, util) => {
  function _finish(ctx, body) {
    /* istanbul ignore else */
    if (ctx.res.finished) {
      throw new Error('Already finished');
    }

    ctx.res.statusCode = this.status_code;
    ctx.res.statusMessage = statusCodes[this.status_code];

    this._response.type = this._response.type || 'application/octet-stream';

    /* istanbul ignore else */
    if (body && typeof body.pipe === 'function') {
      debug('#%s Done. Reponse is an stream. Sending as %s', this.pid, this._response.type);

      /* istanbul ignore else */
      if (!ctx.res._header) {
        ctx.res.setHeader('Content-Type', this._response.type);
        ctx.res.writeHead(ctx.res.statusCode);
      }

      body.pipe(this.res);

      return;
    }

    /* istanbul ignore else */
    if (body !== null && Buffer.isBuffer(body)) {
      debug('#%s Response is a buffer. Sending as %s', this.pid, this._response.type);

      /* istanbul ignore else */
      if (!ctx.res._header) {
        ctx.res.setHeader('Content-Type', this._response.type);
        ctx.res.setHeader('Content-Length', body.length);
      }
    } else if (body !== null && typeof body === 'object') {
      debug('#%s Response is an object. Sending as application/json', this.pid);

      body = JSON.stringify(body);
      this._response.type = 'application/json';
    }

    /* istanbul ignore else */
    if (!ctx.res._header) {
      ctx.res.setHeader('Content-Type', `${this._response.type}; charset=${this._response.charset}`);
      ctx.res.setHeader('Content-Length', Buffer.byteLength(body || ''));
      ctx.res.writeHead(ctx.res.statusCode);
    }

    ctx.res.write(body || '');
  }

  function _done(ctx, code, message) {
    /* istanbul ignore else */
    if ((ctx.res && ctx.res.finished) || ctx.halted) {
      throw new Error('Already finished');
    }

    let _code = code;

    /* istanbul ignore else */
    if (typeof code === 'string' || code instanceof Buffer) {
      message = code;
      _code = 200;
    }

    if (code instanceof Error) {
      message = code.message || code.toString();
      _code = 500;
    }

    // normalize output
    this._response.body = typeof _code === 'string' ? _code : message || this._response.body;

    // normalize response
    this._response.status = typeof _code === 'number' ? _code : this._response.status;

    ctx.send(this._response.body);
  }

  function _write(conn, options) {
    util.extendValues(options.locals, this._response.state);
  }

  return $.module('Conn', {
    _finish,
    _write,
    _done,

    mixins() {
      this._response = {
        state: Object.create(null),
        type: 'text/html',
        body: null,
        status: null,
        charset: 'utf8',
      };

      const self = this;

      return {
        props: {
          // pipeline status
          halted: () => self._response.body !== null && self._response.status !== null,

          // response body
          has_body: () => self._response.body !== null,
          has_status: () => self._response.status !== null,

          status_code: () => (self._response.status !== null
            ? self._response.status
            : 200),

          get state() {
            return self._response.state;
          },

          set state(value) {
            util.extendValues(self._response.state, value);
          },

          get resp_body() {
            return self._response.body;
          },

          set resp_body(value) {
            /* istanbul ignore else */
            if (!(typeof value === 'string' || typeof value === 'object'
              || (value && typeof value.pipe === 'function') || (value instanceof Buffer))) {
              throw new Error(`Invalid resp_body: ${value}`);
            }

            debug('#%s Set body', this.pid);

            self._response.body = value;
          },

          get resp_charset() {
            return self._response.charset;
          },

          set resp_charset(value) {
            self._response.charset = value || 'utf8';
          },
        },
        methods: {
          content_type(mimeType) {
            /* istanbul ignore else */
            if (!(mimeType && typeof mimeType === 'string')) {
              throw new Error(`Invalid type: '${mimeType}'`);
            }

            self._response.type = mimeType;

            return this;
          },

          set_status(code) {
            /* istanbul ignore else */
            if (!(code && statusCodes[code])) {
              throw new Error(`Invalid put_status: ${code}`);
            }

            debug('#%s Set status %s', this.pid, code);

            self._response.status = code;

            return this;
          },

          send(body) {
            return self._finish(this, body);
          },

          end(code, message) {
            return self._done(this, code, message);
          },
        },
      };
    },
  });
};
