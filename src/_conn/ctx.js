import { extend, methods, props } from '../_util';

const statusCodes = require('http').STATUS_CODES;
const qs = require('querystring');
const url = require('url');
const path = require('path');

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

export default (container, server, req, res) => {
  const $ = extend({}, container.extensions);

  const _state = {
    type: 'text/html',
    status: res.statusCode,
    req_headers: req.headers || {},
    resp_headers: res.headers || {},
    resp_charset: 'utf8',
    resp_body: null,
  };

  const _filters = [];

  function _send() {
    Promise.all(_filters.map(cb => cb($)))
      .then(() => {
        // set final status code
        res.statusCode = _state.status;
        res.statusMessage = statusCodes[res.statusCode];

        // normalize response body
        let _output = _state.resp_body;

        /* istanbul ignore else */
        if (_output !== null && typeof _output === 'object') {
          _state.resp_headers['content-type'] = `application/json; charset=${_state.resp_charset}`;
          _output = JSON.stringify(_output);
        }

        /* istanbul ignore else */
        if (!_state.resp_headers['content-type']) {
          _state.resp_headers['content-type'] = `${_state.type}; charset=${_state.resp_charset}`;
        }

        // normalize response haders
        Object.keys(_state.resp_headers).forEach((key) => {
          res.setHeader(key, _state.resp_headers[key]);
        });

        res.writeHead(res.statusCode);

        if (typeof _output === 'string' || _output instanceof Buffer) {
          res.end(_output);
        } else {
          res.end();
        }
      })
      .catch((err) => {
        res.setHeader(`content-type', 'text/plain; charset=${_state.resp_charset}`);
        res.end(err.stack || err.message || err.toString());
      });
  }

  function _end() {
    /* istanbul ignore else */
    if (res.finished) {
      throw new Error('Response already sent');
    }
  }

  methods($, {
    // standard request and response objects
    req,
    res,

    // current environment
    env: process.env.NODE_ENV || 'dev',

    // current connection
    host: server.location.host || server.host,
    port: server.location.port || server.port,
    scheme: server.location.scheme,
    remote_ip: '0.0.0.0',
    script_name: path.relative(process.cwd(), process.argv[1]),

    type: () => (req.headers['content-type'] || '').split(';')[0] || null,
    method: () => req.method,

    params: () => extend({}, $.path_params, $.query_params, $.body_params),
    handler: () => extend({}, req.handler || {}),
    path_info: () => req.url.split('?')[0].split('/').filter(x => x),
    path_params: () => extend({}, req.params || {}),
    body_params: () => extend({}, req.body || {}),
    request_path: () => req.url.split('?')[0],

    query_string: () => req.url.split('?')[1] || '',
    query_params: () => qs.parse(req.url.split('?')[1] || ''),

    before_send(cb) {
      _filters.push(cb);

      return $;
    },

    // request headers
    req_headers: () => extend({}, _state.req_headers),

    get_req_header(name, defvalue) {
      if (!(name && typeof name === 'string')) {
        throw new Error(`Invalid req_header: '${name}'`);
      }

      const _value = _state.req_headers[name.toLowerCase()];

      /* istanbul ignore else */
      if (typeof _value === 'undefined') {
        return defvalue;
      }

      return _value;
    },

    put_req_header(name, value) {
      if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
        throw new Error(`Invalid req_header: '${name}' => '${value}'`);
      }

      _state.req_headers[name.toLowerCase()] = value;

      return $;
    },

    delete_req_header(name) {
      if (!(name && typeof name === 'string')) {
        throw new Error(`Invalid req_header: '${name}'`);
      }

      delete _state.req_headers[name.toLowerCase()];

      return $;
    },

    // response headers
    get_resp_header(name) {
      return _state.resp_headers[name.toLowerCase()];
    },

    put_resp_header(name, value) {
      if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
        throw new Error(`Invalid resp_header: '${name}' => '${value}'`);
      }

      _state.resp_headers[name] = value;

      return $;
    },

    merge_resp_headers(headers) {
      if (!(headers && (typeof headers === 'object' && !Array.isArray(headers)))) {
        throw new Error(`Invalid resp_headers: '${headers}'`);
      }

      Object.keys(headers).forEach((key) => {
        $.put_resp_header(key, headers[key]);
      });

      return $;
    },

    delete_resp_header(name) {
      if (!(name && typeof name === 'string')) {
        throw new Error(`Invalid resp_header: '${name}'`);
      }

      delete _state.resp_headers[name.toLowerCase()];

      return $;
    },

    put_resp_content_type(mimeType) {
      if (!(mimeType && typeof mimeType === 'string')) {
        throw new Error(`Invalid type: '${mimeType}'`);
      }

      _state.resp_headers['content-type'] = `${mimeType}; charset=${_state.resp_charset}`;
      _state.type = mimeType;

      return $;
    },

    put_status(code) {
      /* istanbul ignore else */
      if (!(code && statusCodes[code])) {
        throw new Error(`Invalid put_status: ${code}`);
      }

      _state.status = res.statusCode = code;

      return $;
    },

    redirect(location) {
      if (!(location && typeof location === 'string')) {
        throw new Error(`Invalid location: '${location}`);
      }

      _end();

      _state.status = 302;
      _state.resp_headers.location = _fixURL(location);

      _send();

      return $;
    },

    resp(code, message) {
      _end();

      let _code = code;

      // shortcut for errors
      if (code instanceof Error) {
        message = code.message || code.toString();
        _code = code.statusCode || 500;
      }

      if (typeof code === 'string') {
        message = code;
        _code = 200;
      }

      // normalize given status code
      _state.status = typeof _code === 'number' ? _code : _state.status;

      // normalize given output
      _state.resp_body = typeof _code === 'string' ? _code : message || _state.resp_body;

      _send();

      return $;
    },
  });

  // dynamic props
  props($, {
    resp_headers(value) {
      if (!(value && (typeof value === 'object' && !Array.isArray(value)))) {
        throw new Error(`Invalid resp_headers: '${value}'`);
      }
    },
    resp_charset(value) {
      /* istanbul ignore else */
      if (!value) {
        throw new Error(`Invalid resp_charset: ${value}`);
      }

      _state.resp_headers['content-type'] = `${_state.type}; charset=${value}`;
    },
    resp_body(value) {
      /* istanbul ignore else */
      if (!((value instanceof Buffer) || typeof value === 'object' || typeof value === 'string')) {
        throw new Error(`Invalid resp_body: ${value}`);
      }

      _state.status = 200;
    },
  }, _state);

  return $;
};
