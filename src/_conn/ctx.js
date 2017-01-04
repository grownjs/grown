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
    resp_cookies: {},
    resp_headers: {},
    resp_charset: 'utf8',
    resp_body: null,
    status: res.statusCode,
  };

  function _send() {
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
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');

      _output = JSON.stringify(_output);
    }

    /* istanbul ignore else */
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    }

    if (typeof _output === 'string' || _output instanceof Buffer) {
      res.end(_output);
    } else {
      res.end();
    }
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

    params: () => _extend({}, $.query_params, $.body_params, $.path_params),
    handler: () => req.handler || {},
    path_info: () => req.url.split('?')[0].split('/').filter(x => x),
    path_params: () => req.params || {},
    body_params: () => req.body || {},
    request_path: () => req.url.split('?')[0],

    query_string: () => req.url.split('?')[1] || '',
    query_params: () => qs.parse(req.url.split('?')[1] || ''),

    send_file() {},
    before_send() {},

    cookies: () => _extend({}, $.req_cookies, $.resp_cookies),
    req_cookies: () => req.cookie || {},

    put_resp_cookie(key, value, opts = {}) {
      _state.resp_cookies[key] = { value, opts };

      return $;
    },

    delete_resp_cookie(key) {
      delete _state.resp_cookies[key];

      return $;
    },

    update_resp_cookie(key, value, opts = {}) {
      if (_state.resp_cookies[key]) {
        _state.resp_cookies[key].value = value;
        _extend(_state.resp_cookies[key].opts, opts);
      }

      return $;
    },

    session: () => req.session || {},

    put_session(key, value) {
      if (req.session) {
        req.session[key] = value;
      }

      return $;
    },

    clear_session() {
      req.session = {};

      return $;
    },

    delete_session() {
      delete req.session;

      return $;
    },

    // TODO:
    configure_session() {},

    req_headers: () => req.headers,

    // get request headers by name
    get_req_header(name, defvalue) {
      const _value = req.headers[name.toLowerCase()];

      /* istanbul ignore else */
      if (typeof _value === 'undefined') {
        return defvalue;
      }

      return _value;
    },

    put_req_header() {},
    delete_req_header() {},
    update_req_header() {}, // if present

    get_resp_header() {},
    merge_resp_headers() {},
    put_resp_content_type() {},

    // set response headers
    put_resp_header(name, value, multiple) {
      /* istanbul ignore else */
      if (typeof name === 'object') {
        Object.keys(name).forEach((key) => {
          $.put_resp_header(key, name[key], multiple);
        });

        return $;
      }

      if (multiple === true) {
        _state.resp_headers[name] = _state.resp_headers[name] || [];

        /* istanbul ignore else */
        if (!Array.isArray(_state.resp_headers[name])) {
          _state.resp_headers[name] = [_state.resp_headers[name]];
        }

        _state.resp_headers[name].push(value);
      } else {
        _state.resp_headers[name] = value;
      }

      return $;
    },

    // remove headers from response
    delete_resp_header(key) {
      delete _state.resp_headers[key.toLowerCase()];

      return $;
    },

    update_resp_header() {}, // if present

    put_status(code) {
      /* istanbul ignore else */
      if (!statusCodes[code]) {
        throw new Error(`Invalid statusCode: ${code}`);
      }

      _state.status = res.statusCode = code;

      return $;
    },

    // handle redirections
    redirect(location) {
      _end();

      _state.status = 302;
      _state.resp_headers.location = _fixURL(location);

      _send();

      return $;
    },

    // responds with the final body to the client
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
    resp_body(value) {
      /* istanbul ignore else */
      if (!((value instanceof Buffer) || typeof value === 'string')) {
        throw new Error(`Invalid body: ${value}`);
      }

      _state.status = 200;
    },
    resp_charset(value) {
      /* istanbul ignore else */
      if (!value) {
        throw new Error(`Invalid charset: ${value}`);
      }
    },
    resp_headers(value) {
      if ((!value && value !== null) && !Array.isArray(value)) {
        throw new Error(`Invalid headers: ${value}`);
      }
    },
    resp_cookies() {
      // TODO:
    },
  });

  return $;
};
