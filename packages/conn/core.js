'use strict';

const debug = require('debug')('grown:conn');

const statusCodes = require('http').STATUS_CODES;

module.exports = $ => {
  function finish(ctx, body) {
    /* istanbul ignore else */
    if (this.res.finished) {
      throw new Error('Already finished');
    }

    this.res.statusCode = this.status_code;
    this.res.statusMessage = statusCodes[this.status_code];

    ctx._type = ctx._type || 'application/octet-stream';

    /* istanbul ignore else */
    if (body && typeof body.pipe === 'function') {
      debug('#%s Done. Reponse is an stream. Sending as %s', this.pid, ctx._type);

      /* istanbul ignore else */
      if (!this.res._header) {
        this.res.setHeader('Content-Type', ctx._type);
        this.res.writeHead(this.res.statusCode);
      }

      body.pipe(this.res);

      return;
    }

    /* istanbul ignore else */
    if (body !== null && Buffer.isBuffer(body)) {
      debug('#%s Response is a buffer. Sending as %s', this.pid, ctx._type);

      /* istanbul ignore else */
      if (!this.res._header) {
        this.res.setHeader('Content-Type', ctx._type);
        this.res.setHeader('Content-Length', body.length);
      }
    } else if (body !== null && typeof body === 'object') {
      debug('#%s Response is an object. Sending as application/json', this.pid);

      body = JSON.stringify(body);
      ctx._type = 'application/json';
    }

    /* istanbul ignore else */
    if (!this.res._header) {
      this.res.setHeader('Content-Type', `${ctx._type}; charset=${ctx._charset}`);
      this.res.setHeader('Content-Length', Buffer.byteLength(body || ''));
      this.res.writeHead(this.res.statusCode);
    }

    // normalize response
    this.res.write(body || '');
    this.res.end();
  }

  function done(ctx, code, message) {
    ctx._counter += 1;

    /* istanbul ignore else */
    if (this.res && this.res.finished) {
      /* istanbul ignore else */
      if (ctx._counter > 1) {
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
      message = code.message || code.toString();
      _code = 500;
    }

    // normalize output
    ctx._body = typeof _code === 'string' ? _code : message || ctx._body;

    // normalize response
    ctx._status = typeof _code === 'number' ? _code : ctx._status;

    return Promise.resolve()
      .then(() => ctx._body)
      .then(_body => this.send(_body));
  }

  return $.module('Conn', {
    mixins() {
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
            return finish.call(this, scope, body);
          },

          end(code, message) {
            return done.call(this, scope, code, message);
          },
        },
      };
    },
  });
};
