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
        return obj[key];
      },
      set() {
        throw new Error(`Property '${key}' is read-only`);
      },
    });
  });
}

// inject dynamic getter/setter properties
function _props(target, state, keys) {
  keys.forEach((key) => {
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: true,
      get() {
        return state[key];
      },
      set(value) {
        state[key] = value;
      },
    });
  });
}

export default (container, server, req, res) => {
  const $ = _extend({}, container.extensions);

  const _state = {
    finished: false,
    charset: 'utf8',
    headers: {},
    status: 200,
    body: '',
  };

  function _send() {
    // normalize response haders
    Object.keys(_state.headers).forEach((key) => {
      $.res.setHeader(key.replace(/(^|-)(\w)/g,
        (_, pre, char) => pre + char.toUpperCase()), _state.headers[key]);
    });

    // normalize response body
    let _output = _state.body;

    /* istanbul ignore else */
    if (typeof _output === 'object') {
      $.res.setHeader('Content-Type', 'application/json; charset=UTF-8');

      _output = JSON.stringify(_output);
    }

    /* istanbul ignore else */
    if (!$.res.getHeader('Content-Type')) {
      $.res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    }

    if (typeof _output === 'string' || _output instanceof Buffer) {
      $.res.end(_output);
    } else {
      $.res.end();
    }
  }

  function _end() {
    /* istanbul ignore else */
    if (_state.finished) {
      throw new Error('Response Already Sent');
    }
  }

  _methods($, {
    // standard request and response objects
    req,
    res,

    // current environment
    env: process.env.NODE_ENV || 'dev',

    // current connection
    host: server.location.host,
    port: server.location.port,
    method: 'GET',
    path_info: () => req.url.split('?')[0].split('/').filter(x => x),
    script_name: path.relative(process.cwd(), process.argv[1]),
    request_path: () => req.url.split('?')[0],
    remote_ip: '0.0.0.0',
    req_headers: () => req.headers,
    type: (req.headers['content-type'] || '').split(';')[0],
    scheme: server.location.scheme,
    path_params: () => req.params || {},
    body_params: () => req.body || {},
    query_string: () => req.url.split('?')[1],
    query_params: () => qs.parse(req.url.split('?')[1] || ''),
    params: () => _extend({}, $.query_params, $.body_params, $.path_params),

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
      _state.status = typeof _code === 'number' ? _code : $.res.statusCode;

      // normalize given output
      _state.body = typeof _code === 'string' ? _code : message || _state.body;

      _send();

      return $;
    },

    send_resp() {
      _end();
      _send();

      return $;
    },

    // get request headers by name
    get_req_header(name, defvalue) {
      const _value = $.req.headers[name.toLowerCase()];

      /* istanbul ignore else */
      if (typeof _value === 'undefined') {
        return defvalue;
      }

      return _value;
    },

    // set response headers
    put_resp_header(name, value, multiple) {
      /* istanbul ignore else */
      if (typeof name === 'object') {
        Object.keys(name).forEach((key) => {
          $.put_resp_header(key, name[key]);
        });

        return $;
      }

      if (multiple === true) {
        _state.headers[name] = _state.headers[name] || [];

        /* istanbul ignore else */
        if (!Array.isArray(_state.headers[name])) {
          _state.headers[name] = [_state.headers[name]];
        }

        _state.headers[name].push(value);
      } else {
        _state.headers[name] = value;
      }

      return $;
    },

    // remove headers from response
    delete_resp_header(keys) {
      (Array.isArray(keys) ? keys : [keys])
        .forEach((key) => {
          delete _state.headers[key.toLowerCase()];
        });

      return $;
    },

    // handle redirections
    redirect(location) {
      _end();

      $.status(302);
      $.put_resp_header('location', _fixURL(location));

      _send();

      return $;
    },

    // response status
    status(code) {
      /* istanbul ignore else */
      if (!statusCodes[code]) {
        throw new Error(`Invalid statusCode: ${code}`);
      }

      $.res.statusCode = code;
      $.res.statusMessage = statusCodes[code];

      return $;
    },
  });

  // dynamic props
  _props($, _state, [
    'resp_body',
    'resp_charset',
    'resp_headers',
  ]);

  return $;
};
