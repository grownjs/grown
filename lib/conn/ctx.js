'use strict';

const debug = require('debug')('homegrown:conn');

const $new = require('object-new');

const util = require('../util');

const statusCodes = require('http').STATUS_CODES;
const qs = require('querystring');
const url = require('url');
const path = require('path');
const typeIs = require('type-is');
const accepts = require('accepts');

function _fixURL(location) {
  const _uri = url.parse(location);

  let _query = '';

  /* istanbul ignore else */
  if (_uri.query) {
    _query = qs.stringify(qs.parse(_uri.query));
  }

  return [
    _uri.protocol ? `${_uri.protocol}//` : '',
    _uri.hostname ? _uri.hostname : '',
    _uri.port ? `:${_uri.port}` : '',
    _uri.pathname ? _uri.pathname : '',
    _query ? `?${_query}` : '',
  ].join('');
}

$new('Homegrown.conn', {
  init($, server, req, res) {
    const _state = {
      resp_locals: {},
      resp_headers: {},
      resp_charset: 'utf8',
      resp_body: null,
      type: 'text/html',
    };

    const _filters = [];

    return {
      props: {
        // standard request and response objects
        req: () => req,
        res: () => res,

        // current environment
        env: $._opts.env || process.env.NODE_ENV || 'dev',

        // current connection
        host: server.location.host || server.host,
        port: server.location.port || server.port,
        scheme: server.location.scheme,
        remote_ip: '0.0.0.0',
        script_name: path.relative(process.cwd(), process.argv[1]),

        method: () => req.method,
        params: () => util.extend({}, this.path_params, this.query_params, this.body_params),
        handler: () => util.extend({}, req.handler || {}),

        path_info: () => req.url.split('?')[0].split('/').filter(x => x),
        path_params: () => util.extend({}, req.params || {}),
        body_params: () => util.extend({}, req.body || {}),
        request_path: () => req.url.split('?')[0],

        query_string: () => req.url.split('?')[1] || '',
        query_params: () => qs.parse(req.url.split('?')[1] || ''),

        is: () => typeIs.bind(null, req),
        accept: () => accepts(req),

        // request headers
        req_headers: () => util.extend({}, req.headers),

        get resp_body() {
          return _state.resp_body;
        },

        set resp_body(value) {
          /* istanbul ignore else */
          if (!(typeof value === 'string' || typeof value === 'object'
            || (typeof value.pipe === 'function') || (value instanceof Buffer))) {
            throw new Error(`Invalid resp_body: ${value}`);
          }

          _state.resp_body = value;
        },

        get resp_locals() {
          return _state.resp_locals;
        },

        set resp_locals(value) {
          _state.resp_locals = value || {};
        },

        get resp_charset() {
          return _state.resp_charset;
        },

        set resp_charset(value) {
          _state.resp_charset = value || 'utf8';
        },

        get resp_headers() {
          return _state.resp_headers;
        },

        set resp_headers(value) {
          _state.resp_headers = value || {};
        },
      },
      methods: {
        before_send(cb) {
          debug('Registering before_send handler');

          _filters.push(cb);

          return this;
        },

        get_req_header(name, defvalue) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid req_header: '${name}'`);
          }

          /* istanbul ignore else */
          if (typeof req.headers[name] === 'undefined') {
            return defvalue;
          }

          return req.headers[name];
        },

        put_req_header(name, value) {
          /* istanbul ignore else */
          if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
            throw new Error(`Invalid req_header: '${name}' => '${value}'`);
          }

          req.headers[name] = value;

          return this;
        },

        delete_req_header(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid req_header: '${name}'`);
          }

          delete req.headers[name];

          return this;
        },

        // response headers
        get_resp_header(name) {
          return _state.resp_headers[name] || res.getHeader(name);
        },

        put_resp_header(name, value) {
          /* istanbul ignore else */
          if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
            throw new Error(`Invalid resp_header: '${name}' => '${value}'`);
          }

          _state.resp_headers[name] = value;

          return this;
        },

        merge_resp_headers(headers) {
          /* istanbul ignore else */
          if (!(headers && (typeof headers === 'object' && !Array.isArray(headers)))) {
            throw new Error(`Invalid resp_headers: '${headers}'`);
          }

          Object.keys(headers).forEach((key) => {
            this.put_resp_header(key, headers[key]);
          });

          return this;
        },

        delete_resp_header(name) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid resp_header: '${name}'`);
          }

          delete _state.resp_headers[name];

          res.removeHeader(name);

          return this;
        },

        put_resp_content_type(mimeType) {
          /* istanbul ignore else */
          if (!(mimeType && typeof mimeType === 'string')) {
            throw new Error(`Invalid type: '${mimeType}'`);
          }

          _state.resp_headers['Content-Type'] =
            `${mimeType}; charset=${_state.resp_charset}`;

          _state.type = mimeType;

          return this;
        },

        put_local(name, value) {
          /* istanbul ignore else */
          if (!(name && typeof name === 'string')) {
            throw new Error(`Invalid put_local: '${name}' => '${value}'`);
          }

          _state.resp_locals[name] = value;

          return this;
        },

        merge_locals(values) {
          /* istanbul ignore else */
          if (!(values && (typeof values === 'object' && !Array.isArray(values)))) {
            throw new Error(`Invalid merge_locals: '${values}'`);
          }

          Object.keys(values).forEach((key) => {
            this.put_local(key, values[key]);
          });

          return this;
        },

        put_status(code) {
          /* istanbul ignore else */
          if (!(code && statusCodes[code])) {
            throw new Error(`Invalid put_status: ${code}`);
          }

          res.statusCode = code;

          return this;
        },

        redirect(location) {
          /* istanbul ignore else */
          if (!(location && typeof location === 'string')) {
            throw new Error(`Invalid location: '${location}`);
          }

          debug('Done. Redirection was found');

          return this.put_resp_header('location', _fixURL(location)).end(302);
        },

        end(code, message) {
          /* istanbul ignore else */
          if (this.halted || res.finished) {
            return Promise.reject(new Error('Response already sent'));
          }

          debug('Done. Trying to flush the response');

          this.halted = true;

          let _code = code;

          /* istanbul ignore else */
          if (code instanceof Error) {
            message = code.message || code.toString();
            _code = code.statusCode || 500;
          }

          /* istanbul ignore else */
          if (typeof code === 'string') {
            message = code;
            _code = 200;
          }

          // normalize output
          _state.resp_body = typeof _code === 'string' ? _code : message || _state.resp_body || '';

          // normalize response
          res.statusCode = typeof _code === 'number' ? _code : res.statusCode;
          res.statusMessage = statusCodes[res.statusCode];

          return Promise.resolve()
            .then(() =>
              _filters.reduce((prev, cb) => prev.then(() => cb(this)), Promise.resolve()))
            .then(() => {
              debug('%s before_send filter%s %s run',
                _filters.length,
                _filters.length === 1 ? '' : 's',
                _filters.length === 1 ? 'was' : 'were');

              // final body
              let _body = _state.resp_body;

              /* istanbul ignore else */
              if (_body !== null && typeof _body.pipe === 'function') {
                debug('Done. Response body is an stream. Sending as application/octet-stream');

                _state.resp_headers['Content-Type'] = 'application/octet-stream';

                res.writeHead(res.statusCode, _state.resp_headers);

                _body.pipe(res);

                return;
              }

              /* istanbul ignore else */
              if (!_body !== null && Buffer.isBuffer(_body)) {
                debug('Response body is a buffer. Sending as application/octet-stream');

                _state.resp_headers['Content-Type'] = 'application/octet-stream';
                _state.resp_headers['Content-Length'] = _body.length;
              }

              /* istanbul ignore else */
              if (_body !== null && typeof _body === 'object') {
                debug('Response body is an object. Sending as application/json');

                _state.resp_headers['Content-Type'] =
                  `application/json; charset=${_state.resp_charset}`;

                try {
                  _body = JSON.stringify(_body);
                } catch (e) {
                  const err = new Error();

                  err.debug = {
                    summary: 'Cannot serialize json as response body',
                    data: _state.resp_body,
                  };

                  throw err;
                }
              }

              /* istanbul ignore else */
              if (!_state.resp_headers['Content-Type']) {
                _state.resp_headers['Content-Type'] =
                  `${_state.type}; charset=${_state.resp_charset}`;
              }

              debug('Done. Trying to send the final response');

              // normalize response
              res.writeHead(res.statusCode, _state.resp_headers);
              res.write(_body);
              res.end();
            });
        },
      },
    };
  },
});

module.exports = function $conn(server, req, res) {
  return $new('Homegrown.conn').new(this, server, req, res);
};
