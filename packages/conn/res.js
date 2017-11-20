'use strict';

const debug = require('debug')('grown:conn');

const statusCodes = require('http').STATUS_CODES;
const mime = require('mime');
const send = require('send');
const path = require('path');

module.exports = ($, util) => {
  function _finishRequest(ctx, body) {
    /* istanbul ignore else */
    if (ctx.res.finished) {
      throw new Error('Already finished');
    }

    ctx.res.statusCode = ctx.status_code;
    ctx.res.statusMessage = statusCodes[ctx.res.statusCode];

    /* istanbul ignore else */
    if (body && typeof body.pipe === 'function') {
      debug('#%s Done. Reponse is an stream. Sending as %s', ctx.pid, ctx.content_type);

      /* istanbul ignore else */
      if (!ctx.res._header) {
        ctx.res.setHeader('Content-Type', ctx.content_type);
        ctx.res.writeHead(ctx.res.statusCode);
      }

      body.pipe(ctx.res);

      return;
    }

    /* istanbul ignore else */
    if (body !== null && Buffer.isBuffer(body)) {
      debug('#%s Response is a buffer. Sending as %s', ctx.pid, ctx.content_type);

      /* istanbul ignore else */
      if (!ctx.res._header) {
        ctx.res.setHeader('Content-Type', ctx.content_type);
        ctx.res.setHeader('Content-Length', body.length);
      }
    } else if (body !== null && typeof body === 'object') {
      debug('#%s Response is an object. Sending as application/json', ctx.pid);

      body = JSON.stringify(body);
      ctx.content_type = 'application/json';
    }

    /* istanbul ignore else */
    if (!ctx.res._header) {
      ctx.res.setHeader('Content-Type', `${ctx.content_type}; charset=${ctx.resp_charset}`);
      ctx.res.setHeader('Content-Length', Buffer.byteLength(body || ''));
      ctx.res.writeHead(ctx.res.statusCode);
    }

    ctx.res.write(body || '');
    ctx.res.end();
  }

  function _endRequest(ctx, code, message) {
    /* istanbul ignore else */
    if ((ctx.res && ctx.res.finished) || ctx.halted) {
      throw new Error('Already finished');
    }

    let _code = code;

    /* istanbul ignore else */
    if (typeof code === 'string' || code instanceof Buffer) {
      _code = ctx.status_code;
      message = code;
    }

    if (code instanceof Error) {
      message = code.message || code.toString();
      _code = code.statusCode || 500;
    }

    // normalize output
    ctx.resp_body = typeof _code === 'string' ? _code : message || ctx.resp_body;

    // normalize response
    ctx.status_code = typeof _code === 'number' ? _code : ctx.status_code;

    ctx.send(ctx.resp_body);
  }

  return $.module('Conn.Res', {
    _finishRequest,
    _endRequest,

    before_render(ctx, template) {
      util.extendValues(template.locals, ctx.state);
    },

    mixins() {
      const self = this;

      const _response = {
        headers: Object.create(null),
        state: Object.create(null),
        type: 'text/html',
        body: null,
        status: null,
        charset: 'utf8',
      };

      return {
        props: {
          // pipeline status
          halted: () => _response.body !== null && _response.status !== null,

          // response body
          has_body: () => _response.body !== null,
          has_status: () => _response.status !== null,

          get state() {
            return _response.state;
          },

          set state(value) {
            util.extendValues(_response.state, value);
          },

          get content_type() {
            return _response.type;
          },

          set content_type(mimeType) {
            /* istanbul ignore else */
            if (!(mimeType && typeof mimeType === 'string')) {
              throw new Error(`Invalid type: '${mimeType}'`);
            }

            _response.type = mimeType;

            return this;
          },

          get status_code() {
            return _response.status !== null
              ? _response.status
              : 200;
          },

          set status_code(code) {
            /* istanbul ignore else */
            if (!(code && statusCodes[code])) {
              throw new Error(`Invalid set_status: ${code}`);
            }

            debug('#%s Set status %s', this.pid, code);

            _response.status = code;

            return this;
          },

          get resp_body() {
            return _response.body;
          },

          set resp_body(value) {
            /* istanbul ignore else */
            if (!(typeof value === 'string' || typeof value === 'object'
              || (value && typeof value.pipe === 'function') || (value instanceof Buffer))) {
              throw new Error(`Invalid resp_body: ${value}`);
            }

            debug('#%s Set body', this.pid);

            _response.body = value;
          },

          get resp_charset() {
            return _response.charset;
          },

          set resp_charset(value) {
            _response.charset = value || 'utf8';
          },
        },
        methods: {
          send_file(entry, mimeType) {
            /* istanbul ignore else */
            if (typeof entry === 'object') {
              mimeType = entry.type || mimeType;
              entry = entry.file;
            }

            /* istanbul ignore else */
            if (!mimeType) {
              mimeType = mime.getType(entry);
            }

            const pathname = encodeURI(path.basename(entry));

            const file = send(req, pathname, {
              root: path.dirname(entry),
            });

            file.on('headers', _res => {
              /* istanbul ignore else */
              if (mimeType) {
                _res.setHeader('Content-Type', mimeType);
              }
            });

            return new Promise((resolve, reject) => {
              file.on('error', reject);
              file.on('end', resolve);
              file.pipe(res);
            });
          },

          send(body) {
            return self._finishRequest(this, body);
          },

          end(code, message) {
            return self._endRequest(this, code, message);
          },
        },
      };
    },
  });
};
