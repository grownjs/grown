'use strict';

const debug = require('debug')('grown:conn:response');

const statusCodes = require('http').STATUS_CODES;
const url = require('url');
const mime = require('mime');
const send = require('send');
const path = require('path');

module.exports = (Grown, util) => {
  function _finishRequest(ctx, body) {
    return ctx.halt(() => {
      /* istanbul ignore else */
      if (ctx.res.finished) {
        throw new Error('Already finished');
      }

      /* istanbul ignore else */
      if (ctx.res._done) {
        debug('#%s Already done, skipping.', ctx.pid);
        return;
      }

      debug('#%s Halting... %s', ctx.pid);

      ctx.res._done = true;
      ctx.res.statusCode = ctx.status_code;
      ctx.res.statusMessage = statusCodes[ctx.res.statusCode];

      /* istanbul ignore else */
      if (body && typeof body.pipe === 'function') {
        debug('#%s Done. Reponse is an stream. Sending as %s', ctx.pid, ctx.content_type);

        /* istanbul ignore else */
        if (!ctx.res._header) {
          ctx.res.setHeader('Content-Type', ctx.content_type);
        }

        return new Promise((resolve, reject) => {
          body.on('close', resolve);
          body.on('error', reject);
          body.pipe(ctx.res);
        });
      }

      let type;
      let length;
      /* istanbul ignore else */
      if (body !== null && Buffer.isBuffer(body)) {
        type = 'buffer';
        length = body.length;
      } else if (body !== null && typeof body === 'object') {
        type = 'object';
        body = JSON.stringify(body);
        length = Buffer.byteLength(body || '');
        ctx.content_type = 'application/json';
      } else if (typeof body === 'string') {
        type = 'string';
        length = body.length;
      }

      debug('#%s Response is %s. Sending as %s', ctx.pid, type, ctx.content_type);

      /* istanbul ignore else */
      if (!process.proxied && !ctx.res._halted && length) {
        ctx.res.setHeader('Content-Length', length);
      }

      ctx.res.setHeader('Content-Type', `${ctx.content_type}; charset=${ctx.resp_charset}`);
      ctx.res.write(body || '');
      ctx.res.end();
    }).catch(e => {
      /* istanbul ignore else */
      if (e.code !== 'ERR_STREAM_WRITE_AFTER_END') throw e;
    });
  }

  function _endRequest(ctx, code, message) {
    /* istanbul ignore else */
    if (ctx.res && ctx.res.finished) {
      throw new Error('Already finished');
    }

    let _code = code;

    /* istanbul ignore else */
    if (typeof code === 'string' || code instanceof Buffer) {
      _code = ctx.status_code;
      message = code;
    }

    /* istanbul ignore else */
    if (code instanceof Error) {
      message = code.message || code.toString();
      _code = code.statusCode || 500;
    }

    /* istanbul ignore else */
    if (!ctx.has_body) {
      ctx.resp_body = message || ctx.resp_body;
    }

    /* istanbul ignore else */
    if (!ctx.has_status) {
      ctx.status_code = typeof _code === 'number' ? _code : ctx.status_code;
    }
    return ctx.send(ctx.resp_body);
  }

  function _cutBody(value) {
    /* istanbul ignore else */
    if (typeof value !== 'string') {
      value = util.inspect(value);
    }

    value = value.replace(/\s+/g, ' ').trim();

    return `${value.length > 99 ? value.substr(0, 100) : value} ... length: ${value.length}`;
  }

  function _fixURL(location) {
    const _uri = url.parse(location);

    let _query = '';

    /* istanbul ignore else */
    if (_uri.query) {
      _query = new URLSearchParams(_uri.query).toString();
    }

    return [
      _uri.protocol ? `${_uri.protocol}//` : '',
      _uri.hostname ? _uri.hostname : '',
      _uri.port ? `:${_uri.port}` : '',
      _uri.pathname ? _uri.pathname : '/',
      _query ? `?${_query.replace(/=$/, '')}` : '',
      _uri.hash,
    ].join('');
  }

  return Grown('Conn.Response', {
    _finishRequest,
    _endRequest,
    _cutBody,
    _fixURL,

    $before_render(ctx, template) {
      util.extendValues(template.locals, ctx.state);
    },

    $mixins() {
      const self = this;

      const _response = {
        headers: Object.create(null),
        type: 'text/html',
        body: null,
        status: null,
        charset: 'utf8',
      };

      return {
        props: {
          // response body
          has_body: () => _response.body !== null,
          has_status: () => _response.status !== null,

          get content_type() {
            return _response.type;
          },

          set content_type(mimeType) {
            /* istanbul ignore else */
            if (!(mimeType && typeof mimeType === 'string')) {
              throw new Error(`Invalid type: '${mimeType}'`);
            }

            _response.type = mimeType;
          },

          get status_code() {
            return _response.status !== null
              ? _response.status
              : 200;
          },

          set status_code(code) {
            /* istanbul ignore else */
            if (!(code && typeof code === 'number' && statusCodes[code])) {
              throw new Error(`Invalid status_code: ${code}`);
            }

            debug('#%s Set status: %s', this.pid, code);

            _response.status = code;
          },

          get resp_body() {
            return _response.body;
          },

          set resp_body(value) {
            /* istanbul ignore else */
            if (!(typeof value === 'string' || (typeof value === 'object' && !Array.isArray(value))
              || (value && typeof value.pipe === 'function') || (value instanceof Buffer))) {
              throw new Error(`Invalid resp_body: ${value}`);
            }

            debug('#%s Set body: %s', this.pid, self._cutBody(value));

            _response.body = value;
          },

          get resp_charset() {
            return _response.charset;
          },

          set resp_charset(value) {
            /* istanbul ignore else */
            if (typeof value !== 'string') {
              throw new Error(`Invalid charset: ${value}`);
            }

            _response.charset = value || 'utf8';
          },

          get resp_headers() {
            return this.res.getHeaders();
          },

          set resp_headers(value) {
            /* istanbul ignore else */
            if (Object.prototype.toString.call(value) !== '[object Object]') {
              throw new Error(`Invalid headers: ${value}`);
            }

            this.res._headers = value;
          },
        },
        methods: {
          // response headers
          get_resp_header(name) {
            /* istanbul ignore else */
            if (!(name && typeof name === 'string')) {
              throw new Error(`Invalid resp_header: '${name}'`);
            }

            return this.res.getHeader(name);
          },

          put_resp_header(name, value) {
            /* istanbul ignore else */
            if (!name || typeof name !== 'string') {
              throw new Error(`Invalid resp_header: '${name}' => '${value}'`);
            }

            this.res.setHeader(name, value);

            return this;
          },

          merge_resp_headers(headers) {
            /* istanbul ignore else */
            if (!(headers && (typeof headers === 'object' && !Array.isArray(headers)))) {
              throw new Error(`Invalid resp_headers: '${headers}'`);
            }

            Object.keys(headers).forEach(key => {
              this.put_resp_header(key, headers[key]);
            });

            return this;
          },

          delete_resp_header(name) {
            /* istanbul ignore else */
            if (!(name && typeof name === 'string')) {
              throw new Error(`Invalid resp_header: '${name}'`);
            }

            this.res.removeHeader(name);

            return this;
          },

          redirect(location, timeout, body) {
            /* istanbul ignore else */
            if (this.has_status) {
              throw new Error(`Status is already set, given ${this.status_code}`);
            }

            /* istanbul ignore else */
            if (!(location && typeof location === 'string')) {
              throw new Error(`Invalid location: '${location}`);
            }

            /* istanbul ignore else */
            if (typeof timeout === 'number') {
              this.resp_body = `<meta http-equiv="refresh" content="${timeout};url=${location}">${body || ''}`;
              this.status_code = 301;

              return this;
            }

            debug('#%s Done. Redirection was found', this.pid);

            this.put_resp_header('Location', self._fixURL(location));
            this.status_code = 301;
            return this;
          },

          json(value) {
            /* istanbul ignore else */
            if (!value || typeof value !== 'object') {
              throw new Error(`Invalid JSON value: ${value}`);
            }

            return this.send(value);
          },

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

            const file = send(this.req, pathname, {
              root: path.dirname(entry),
            });

            file.on('headers', _res => {
              /* istanbul ignore else */
              if (mimeType) {
                _res.setHeader('Content-Type', mimeType);
              }
            });

            return new Promise((resolve, reject) => {
              this.res.statusCode = 200;
              file.on('error', reject);
              file.on('end', resolve);
              file.pipe(this.res);
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
