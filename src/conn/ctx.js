const { extend, methods, props } = require('../util');

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

module.exports = (container, server, req, res) => {
  const $ = extend({}, container.extensions);

  const _state = {
    resp_locals: {},
    resp_headers: {},
    resp_charset: 'utf8',
    resp_body: null,
    type: 'text/html',
  };

  const _filters = [];

  methods($, {
    // standard request and response objects
    req,
    res,

    // current environment
    env: container.opts.env || process.env.NODE_ENV || 'dev',

    // current connection
    host: server.location.host || server.host,
    port: server.location.port || server.port,
    scheme: server.location.scheme,
    remote_ip: '0.0.0.0',
    script_name: path.relative(process.cwd(), process.argv[1]),

    method: () => req.method,

    params: () => extend({}, $.path_params, $.query_params, $.body_params),
    handler: () => extend({}, req.handler || {}),
    path_info: () => req.url.split('?')[0].split('/').filter(x => x),
    path_params: () => extend({}, req.params || {}),
    body_params: () => extend({}, req.body || {}),
    request_path: () => req.url.split('?')[0],

    query_string: () => req.url.split('?')[1] || '',
    query_params: () => qs.parse(req.url.split('?')[1] || ''),

    is: () => typeIs.bind(null, req),
    accept: () => accepts(req),

    before_send(cb) {
      _filters.push(cb);

      return $;
    },

    // request headers
    req_headers: () => extend({}, req.headers),

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

      return $;
    },

    delete_req_header(name) {
      /* istanbul ignore else */
      if (!(name && typeof name === 'string')) {
        throw new Error(`Invalid req_header: '${name}'`);
      }

      delete req.headers[name];

      return $;
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

      return $;
    },

    merge_resp_headers(headers) {
      /* istanbul ignore else */
      if (!(headers && (typeof headers === 'object' && !Array.isArray(headers)))) {
        throw new Error(`Invalid resp_headers: '${headers}'`);
      }

      Object.keys(headers).forEach((key) => {
        $.put_resp_header(key, headers[key]);
      });

      return $;
    },

    delete_resp_header(name) {
      /* istanbul ignore else */
      if (!(name && typeof name === 'string')) {
        throw new Error(`Invalid resp_header: '${name}'`);
      }

      delete _state.resp_headers[name];

      res.removeHeader(name);

      return $;
    },

    put_resp_content_type(mimeType) {
      /* istanbul ignore else */
      if (!(mimeType && typeof mimeType === 'string')) {
        throw new Error(`Invalid type: '${mimeType}'`);
      }

      _state.resp_headers['Content-Type'] =
        `${mimeType}; charset=${_state.resp_charset}`;

      _state.type = mimeType;

      return $;
    },

    put_local(name, value) {
      /* istanbul ignore else */
      if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
        throw new Error(`Invalid put_local: '${name}' => '${value}'`);
      }

      _state.resp_locals[name] = value;

      return $;
    },

    merge_locals(values) {
      /* istanbul ignore else */
      if (!(values && (typeof values === 'object' && !Array.isArray(values)))) {
        throw new Error(`Invalid merge_locals: '${values}'`);
      }

      Object.keys(values).forEach((key) => {
        $.put_local(key, values[key]);
      });

      return $;
    },

    put_status(code) {
      /* istanbul ignore else */
      if (!(code && statusCodes[code])) {
        throw new Error(`Invalid put_status: ${code}`);
      }

      res.statusCode = code;

      return $;
    },

    redirect(location) {
      /* istanbul ignore else */
      if (!(location && typeof location === 'string')) {
        throw new Error(`Invalid location: '${location}`);
      }

      return $.put_resp_header('location', _fixURL(location)).end(302);
    },

    end(code, message) {
      /* istanbul ignore else */
      if ($.halted || res.finished) {
        throw new Error('Response already sent');
      }

      $.halted = true;

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
          _filters.reduce((prev, cb) => prev.then(() => cb($)), Promise.resolve()))
        .then(() => {
          /* istanbul ignore else */
          if (_state.resp_body !== null && typeof _state.resp_body === 'object') {
            _state.resp_headers['Content-Type'] =
              `application/json; charset=${_state.resp_charset}`;

            _state.resp_body = JSON.stringify(_state.resp_body);
          }

          /* istanbul ignore else */
          if (!_state.resp_headers['Content-Type']) {
            _state.resp_headers['Content-Type'] =
              `${_state.type}; charset=${_state.resp_charset}`;
          }

          // normalize response
          res.writeHead(res.statusCode, _state.resp_headers);
          res.write(_state.resp_body);
          res.end();
        });
    },
  });

  // dynamic props
  props($, {
    resp_locals(value) {
      $.merge_locals(value);
    },
    resp_headers(value) {
      $.merge_resp_headers(value);
    },
    resp_charset(value) {
      /* istanbul ignore else */
      if (!value) {
        throw new Error(`Invalid resp_charset: ${value}`);
      }
    },
    resp_body(value, oldValue) {
      /* istanbul ignore else */
      if (!((value instanceof Buffer) || typeof value === 'object' || typeof value === 'string')) {
        throw new Error(`Invalid resp_body: ${value}`);
      }

      /* istanbul ignore else */
      if (oldValue === null) {
        res.statusCode = 200;
      }
    },
  }, _state);

  return $;
};
