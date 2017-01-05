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

function _extend(target, ...args) {
  args.forEach((source) => {
    Object.keys(source).forEach((key) => {
      /* istanbul ignore else */
      if (typeof target[key] === 'undefined') {
        target[key] = source[key];
      }
    });
  });

  return target;
}

// inject common methods or properties
function _methods(target, obj) {
  Object.keys(obj).forEach((key) => {
    // static getter
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: true,
      get() {
        if (typeof obj[key] === 'function' && !obj[key].length) {
          return obj[key]();
        }

        return obj[key];
      },
      set() {
        throw new Error(`Property '${key}' is read-only`);
      },
    });
  });
}

// inject dynamic getter/setter properties
function _props(target, state, props) {
  Object.keys(props).forEach((prop) => {
    Object.defineProperty(target, prop, {
      configurable: false,
      enumerable: true,
      get() {
        return state[prop];
      },
      set(value) {
        const oldValue = state[prop];

        state[prop] = value;

        try {
          props[prop](value, oldValue);
        } catch (e) {
          throw e;
        }
      },
    });
  });
}

export default (container, server, req, res) => {
  const $ = _extend({}, container.extensions);

  const _state = {
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

        // normalize response haders
        Object.keys(_state.resp_headers).forEach((key) => {
          res.setHeader(key.replace(/(^|-)(\w)/g,
            (_, pre, char) => pre + char.toUpperCase()), _state.resp_headers[key]);
        });

        // normalize response body
        let _output = _state.resp_body;

        /* istanbul ignore else */
        if (typeof _output === 'object') {
          res.setHeader(`Content-Type', 'application/json; charset=${_state.resp_charset}`);

          _output = JSON.stringify(_output);
        }

        /* istanbul ignore else */
        if (!res.getHeader('Content-Type')) {
          res.setHeader(`Content-Type', 'text/html; charset=${_state.resp_charset}`);
        }

        if (typeof _output === 'string' || _output instanceof Buffer) {
          res.end(_output);
        } else {
          res.end();
        }
      })
      .catch((err) => {
        res.setHeader(`Content-Type', 'text/plain; charset=${_state.resp_charset}`);
        res.end(err.stack || err.message || err.toString());
      });
  }

  function _end() {
    /* istanbul ignore else */
    if (res.finished) {
      throw new Error('Response already sent');
    }
  }

  _methods($, {
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

    type: () => (req.headers['content-type'] || '').split(';')[0],
    method: () => req.method,

    params: () => _extend({}, $.path_params, $.query_params, $.body_params),
    handler: () => req.handler || {},
    path_info: () => req.url.split('?')[0].split('/').filter(x => x),
    path_params: () => req.params || {},
    body_params: () => req.body || {},
    request_path: () => req.url.split('?')[0],

    query_string: () => req.url.split('?')[1] || '',
    query_params: () => qs.parse(req.url.split('?')[1] || ''),

    before_send(cb) {
      _filters.push(cb);

      return $;
    },

    // request headers
    get_req_header(name, defvalue) {
      if (!(name && typeof name === 'string')) {
        throw new Error(`Invalid req_header: '${name}'`);
      }

      const _value = req.headers[name.toLowerCase()];

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

      req.headers[name.toLowerCase()] = value;

      return $;
    },

    delete_req_header(name) {
      if (!(name && typeof name === 'string')) {
        throw new Error(`Invalid req_header: '${name}'`);
      }

      delete req.headers[name.toLowerCase()];

      return $;
    },

    // response headers
    get_resp_header(name) {
      return _state.resp_headers[name.toLowerCase()];
    },

    merge_resp_headers(headers) {
      if (!headers || (typeof headers !== 'object' && Array.isArray(headers))) {
        throw new Error(`Invalid resp_headers: '${headers}'`);
      }

      Object.keys(headers).forEach((key) => {
        $.put_resp_header(key, headers[key]);
      });

      return $;
    },

    put_resp_header(name, value) {
      if (!(name && value && typeof name === 'string' && typeof value === 'string')) {
        throw new Error(`Invalid resp_header: '${name}' => '${value}'`);
      }

      _state.resp_headers[name] = value;

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

      _state.resp_headers['content-type'] = mimeType;

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

      // normalize given status code
      _state.status = typeof _code === 'number' ? _code : _state.status;

      // normalize given output
      _state.resp_body = typeof _code === 'string' ? _code : message || _state.resp_body;

      _send();

      return $;
    },
  });

  // dynamic props
  _props($, _state, {
    req_headers(value) {
      if (!value || (typeof value !== 'object' && Array.isArray(value))) {
        throw new Error(`Invalid req_headers: '${value}'`);
      }
    },
    resp_headers(value) {
      if (!value || (typeof value !== 'object' && Array.isArray(value))) {
        throw new Error(`Invalid resp_headers: '${value}'`);
      }
    },
    resp_charset(value) {
      /* istanbul ignore else */
      if (!value) {
        throw new Error(`Invalid resp_charset: ${value}`);
      }
    },
    resp_body(value) {
      /* istanbul ignore else */
      if (!((value instanceof Buffer) || typeof value === 'string')) {
        throw new Error(`Invalid resp_body: ${value}`);
      }

      _state.status = 200;
    },
  });

  return $;
};
