var _env = require('dotenv');

var configure = function ($) {
  $.ctx.configure = function (_opts) { return _env.config(_opts || { silent: true }); };
};

function _expressMiddleware(callback) {
  return function (conn) {
    /* istanbul ignore else */
    if (callback.length === 4) {
      return conn.next().catch(function (error) {
        return new Promise(function (resolve, reject) {
          callback(error, conn.req, conn.res, function (_error) {
            if (_error) {
              reject(_error);
            } else {
              resolve();
            }
          });
        });
      });
    }

    return new Promise(function (resolve, reject) {
      callback(conn.req, conn.res, function (error) {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };
}

var buildFactory = function (Factory, options, _name) {
  var _suffix = _name ? (" (" + _name + ")") : '';

  /* istanbul ignore else */
  if (!Factory) {
    throw new Error(("Expecting a valid callable, given '" + Factory + "'" + _suffix));
  }

  /* istanbul ignore else */
  if (typeof Factory !== 'function') {
    /* istanbul ignore else */
    if (typeof Factory.call === 'function') {
      return {
        name: Factory.name || 'call',
        call: [Factory, 'call'],
        type: 'method',
      };
    }

    /* istanbul ignore else */
    if (typeof Factory.next === 'function') {
      return {
        name: Factory.name || 'next',
        call: Factory,
        type: 'iterator',
      };
    }

    throw new Error(("'Middleware '" + Factory + "' should be callable" + _suffix));
  }

  /* istanbul ignore else */
  if ((Factory.constructor && (Factory.constructor.name === 'GeneratorFunction'))
      || (Factory.prototype && typeof Factory.prototype.next === 'function'
        && typeof Factory.prototype.throw === 'function')) {
    return {
      name: Factory.name || '*',
      call: Factory,
      type: 'generator',
    };
  }

  /* istanbul ignore else */
  if (Factory.prototype && typeof Factory.prototype.call === 'function') {
    return {
      name: Factory.name || 'anonymous',
      call: [new Factory(options), 'call'],
      type: 'method',
    };
  }

  /* istanbul ignore else */
  if (Factory.length > 2) {
    return {
      name: Factory.name || 'anonymous',
      call: _expressMiddleware(Factory),
      type: 'function',
    };
  }

  return {
    name: Factory.name || 'anonymous',
    call: Factory,
    type: 'function',
  };
};

function _when(promise, callback) {
  /* istanbul ignore else */
  if (typeof callback === 'function') {
    promise = promise.then(callback);
  }

  return promise;
}

function _run(task, state, options) {
  switch (task.type) {
    case 'method':
      return task.call[0][task.call[1]](state, options);

    case 'function':
      return task.call(state, options);

    case 'iterator':
    case 'generator': {
      var _iterator = task.type === 'generator' ? task.call(state, options) : task.call;

      return new Promise(function (resolve, reject) {
        function next(err, value) {
          /* istanbul ignore else */
          if (err) {
            reject(err);
            return;
          }

          var result = _iterator.next(value, options);

          if (!result.halted && result.value) {
            /* istanbul ignore else */
            if (typeof result.value.then === 'function'
              && typeof result.value.catch === 'function') {
              _when(result.value, function (_value) {
                next(undefined, _value);
              }).catch(next);
              return;
            }

            var _next =
              (typeof result.value === 'function' || result.value.call || result.value.next)
              ? buildFactory(result.value, options, ((task.name) + "." + (task.type)))
              : result;

            next(undefined, typeof _next.value === 'undefined'
              ? _run(_next, state, options)
              : _next.value);
          } else {
            resolve(result.value);
          }
        }

        next(undefined, state);
      });
    }

    default:
      throw new Error(("Unsupported '" + (task.type) + "' pipeline"));
  }
}

function _pipelineFactory(label, pipeline, _callback) {
  /* istanbul ignore else */
  if (!label) {
    throw new Error(("Label for pipelines are required, given '" + label + "'"));
  }

  /* istanbul ignore else */
  if (!Array.isArray(pipeline)) {
    throw new Error(("The pipeline must be an array, given '" + pipeline + "'"));
  }

  /* istanbul ignore else */
  if (_callback && typeof _callback !== 'function') {
    throw new Error(("The callback must be a function, given '" + _callback + "'"));
  }

  return function (state, options) {
    state = state || {};
    options = options || {};

    /* istanbul ignore else */
    if (state.halted) {
      throw new Error(("Pipeline '" + label + "' Already Finished"));
    }

    // slice to keep original pipeline unmodified
    var _pipeline = pipeline.slice();

    // callstack for debug
    var _stack = [];

    function next(end) {
      var cb = _pipeline.shift();

      if (!cb) {
        end();
      } else {
        var value;

        _stack.push(cb.name);

        /* istanbul ignore else */
        if (state.halted) {
          // short-circuit
          end();
          return;
        }

        // allow continuation
        state.next = function (_resume) {
          /* istanbul ignore else */
          if (!_pipeline.length) {
            return _when(Promise.resolve(state), _resume);
          }

          var _dispatch = _pipelineFactory(cb.name, _pipeline.slice());

          _pipeline = [];

          return _when(_dispatch(state, options), _resume);
        };

        try {
          value = _run(cb, state, options);
        } catch (e) {
          end(e);
          return;
        }

        /* istanbul ignore else */
        if (!value) {
          next(end);
          return;
        }

        if (typeof value.then === 'function' && typeof value.catch === 'function') {
          value
            .then(function () {
              next(end);
            })
            .catch(end);
        } else {
          next(end);
        }
      }
    }

    return new Promise(function (resolve, reject) {
      next(function (err) {
        /* istanbul ignore else */
        if (err) {
          err.pipeline = err.pipeline || [];
          Array.prototype.push.apply(err.pipeline, _stack);
        }

        /* istanbul ignore else */
        if (_callback) {
          try {
            _callback(err, state, options);
          } catch (_err) {
            err = _err;
          }
        }

        if (err) {
          reject(err);
        } else {
          resolve(state);
        }
      });
    });
  };
}

// final handler
function _dispatch(err, conn) {
  /* istanbul ignore else */
  if (!conn.res.finished) {
    var statusCode = conn.status;
    var message = conn.resp_body;

    /* istanbul ignore else */
    if (err) {
      message = err.statusMessage || err.message;
      statusCode = err.statusCode || 501;
    }

    conn.resp(statusCode, message);
  }
}

var dispatch = function ($) {
  $.ctx.dispatch = _pipelineFactory('_dispatch', $.pipeline, _dispatch);
};

var statusCodes = require('http').STATUS_CODES;
var qs = require('querystring');
var url$1 = require('url');
var path = require('path');

function _fixURL(location) {
  var _uri = url$1.parse(location);

  var _query = '';

  /* istanbul ignore else */
  if (_uri.query) {
    _query = qs.stringify(qs.parse(_uri.query));
  }

  return [
    _uri.protocol ? ((_uri.protocol) + "//") : '',
    _uri.hostname ? _uri.hostname : '',
    _uri.port ? (":" + (_uri.port)) : '',
    _uri.pathname ? _uri.pathname : '',
    _query ? ("?" + _query) : '' ].join('');
}

function _extend(target) {
  var args = [], len = arguments.length - 1;
  while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

  args.forEach(function (source) {
    Object.keys(source).forEach(function (key) {
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
  Object.keys(obj).forEach(function (key) {
    // static getter
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: true,
      get: function get() {
        if (typeof obj[key] === 'function' && !obj[key].length) {
          return obj[key]();
        }

        return obj[key];
      },
      set: function set() {
        throw new Error(("Property '" + key + "' is read-only"));
      },
    });
  });
}

// inject dynamic getter/setter properties
function _props(target, state, keys, cb) {
  keys.forEach(function (key) {
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: true,
      get: function get() {
        return state[key];
      },
      set: function set(value) {
        var oldValue = state[key];

        state[key] = value;

        try {
          cb(key, value, oldValue);
        } catch (e) {
          throw e;
        }
      },
    });
  });
}

var connFactory = function (container, server, req, res) {
  var $ = _extend({}, container.extensions);

  var _state = {
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
    Object.keys(_state.resp_headers).forEach(function (key) {
      res.setHeader(key.replace(/(^|-)(\w)/g,
        function (_, pre, char) { return pre + char.toUpperCase(); }), _state.resp_headers[key]);
    });

    // normalize response body
    var _output = _state.resp_body;

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
    req: req,
    res: res,

    // current environment
    env: process.env.NODE_ENV || 'dev',

    // current connection
    host: server.location.host || server.host,
    port: server.location.port || server.port,
    method: 'GET',
    path_info: function () { return req.url.split('?')[0].split('/').filter(function (x) { return x; }); },
    script_name: path.relative(process.cwd(), process.argv[1]),
    request_path: function () { return req.url.split('?')[0]; },
    remote_ip: '0.0.0.0',
    req_headers: function () { return req.headers; },
    type: (req.headers['content-type'] || '').split(';')[0],
    scheme: server.location.scheme,
    handler: function () { return req.handler || {}; },
    path_params: function () { return req.params || {}; },
    body_params: function () { return req.body || {}; },
    query_string: function () { return req.url.split('?')[1] || ''; },
    query_params: function () { return qs.parse(req.url.split('?')[1] || ''); },
    params: function () { return _extend({}, $.query_params, $.body_params, $.path_params); },

    // responds with the final body to the client
    resp: function resp(code, message) {
      _end();

      var _code = code;

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

    // get request headers by name
    get_req_header: function get_req_header(name, defvalue) {
      var _value = req.headers[name.toLowerCase()];

      /* istanbul ignore else */
      if (typeof _value === 'undefined') {
        return defvalue;
      }

      return _value;
    },

    // set response headers
    put_resp_header: function put_resp_header(name, value, multiple) {
      /* istanbul ignore else */
      if (typeof name === 'object') {
        Object.keys(name).forEach(function (key) {
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
    delete_resp_header: function delete_resp_header(keys) {
      (Array.isArray(keys) ? keys : [keys])
        .forEach(function (key) {
          delete _state.resp_headers[key.toLowerCase()];
        });

      return $;
    },

    // handle redirections
    redirect: function redirect(location) {
      _end();

      _state.status = 302;
      _state.resp_headers.location = _fixURL(location);

      _send();

      return $;
    },
  });

  // dynamic props
  _props($, _state, [
    'status',
    'resp_body',
    'resp_charset',
    'resp_headers' ], function (key, newValue, oldValue) {
    switch (key) {
      case 'resp_body':
        /* istanbul ignore else */
        if (!((newValue instanceof Buffer) || typeof newValue === 'string')) {
          throw new Error(("Invalid body: " + newValue));
        }

        _state.status = 200;

        break;

      case 'resp_charset':
        /* istanbul ignore else */
        if (!newValue) {
          throw new Error(("Invalid charset: " + newValue));
        }
        break;

      case 'resp_headers':
        if ((!newValue && newValue !== null) && !Array.isArray(newValue)) {
          throw new Error(("Invalid headers: " + newValue));
        }
        break;

      case 'status':
        /* istanbul ignore else */
        if (!statusCodes[newValue]) {
          throw new Error(("Invalid statusCode: " + newValue));
        }

        /* istanbul ignore else */
        if (oldValue >= 500 && newValue < 500) {
          throw new Error(("Avoid relaxing errors: " + oldValue + " > " + newValue));
        }

        _state.status = res.statusCode = newValue;
        break;

      default:
        throw new Error(("Unknown '" + key + "' property"));
    }
  });

  return $;
};

var hostFactory = function ($, protocol) {
  return function (req, res, next) {
    // normalize
    var host = req.headers.host ? req.headers.host : '';
    var port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    var hostname = port ? host : (host + ":" + (protocol.globalAgent.defaultPort));

    // proxy next() callback
    function _next(e) {
      if (typeof next === 'function') {
        next(e);
      }

      if (!next && e) {
        throw e;
      }
    }

    // error handler
    function fail(e, conn) {
      e.pipeline = e.pipeline || ['host'];

      var _msg = e.message || e.toString();

      _msg = (e.name || 'Error') + "(" + (e.pipeline.join('.')) + "): " + _msg;

      var _stack = (e.stack || '').replace(/.*Error:.+?\n/, '');

      // TODO: send to logger for testing purposes...
      // console.log('ERR', e, conn);

      /* istanbul ignore else */
      if (conn.res.finished) {
        _next(e);
        return;
      }

      // istanbul ignore else
      if (_stack) {
        _msg += "\n" + _stack;
      }

      conn.put_resp_header('content-type', 'text/plain');
      conn.resp(e.statusCode || 500, _msg);
    }

    // lookup opened connection
    var _server = $.hosts[hostname]
      || $.hosts[(hostname + ":" + port)]
      || $.hosts[("0.0.0.0:" + port)];

    /* istanbul ignore else */
    if (_server) {
      var conn = connFactory($, _server, req, res);

      try {
        $.ctx.dispatch(conn, $.opts)
          .catch(function (err) { return fail(err, conn); })
          .then(function () { return _next(); });
      } catch (e) {
        fail(e, conn);
      }
    }
  };
};

var serverFactory = function ($, server, options, callback) {
  var protocolName = server.location.protocol.replace(':', '');
  var host = hostFactory($, $.protocols[protocolName]);

  var _server;

  if (protocolName === 'https') {
    _server = $.protocols[protocolName].createServer(options, host);
  } else {
    _server = $.protocols[protocolName].createServer(host);
  }

  /* istanbul ignore else */
  if (!_server) {
    throw new Error(("Unsupported '" + protocolName + "' protocol"));
  }

  return _server.listen(server.port, '0.0.0.0', function _onListen() {
    setTimeout(function (_self) {
      callback.call(_self);
    }, 0, this);
  });
};

var url = require('url');

var listen = function ($) {
  $.ctx.listen = function (location, options, callback) {
    var _server = {};

    if (typeof location === 'function') {
      callback = location;
      location = '';
    }

    callback = typeof options === 'function' ? options : callback;
    options = !options || typeof options === 'function' ? {} : options;

    var _protocolName = (typeof options === 'object'
      && (options.cert || options.key || options.ca)) ? 'https' : 'http';

    if (typeof location === 'object') {
      _server.location = location;
      _server.location.host = _server.location.host || '';
      _server.location.protocol = _server.location.protocol || 'http';
    } else if (!isNaN(location)) {
      _server.location = url.parse((_protocolName + "://0.0.0.0:" + location));
    } else if (typeof location === 'string') {
      _server.location = url.parse(location.indexOf('://') === -1 ? ("http://" + location) : location);
    } else if (!location) {
      _server.location = url.parse((_protocolName + "://0.0.0.0:80/"));
    }

    _server.port = +(_server.location.protocol === 'http:' && (options.cert && options.key)
      ? (_server.location.port || 443)
      : (_server.location.port || 80));

    _server.location.host = _server.location.host.split(':')[1]
      ? _server.location.host
      : ((_server.location.host) + ":" + (_server.port));

    _server.host = _server.location.host.split(':')[0];

    _protocolName = _server.location.protocol.replace(':', '');

    /* eslint-disable global-require */
    /* eslint-disable import/no-dynamic-require */
    $.protocols[_protocolName] = $.protocols[_protocolName] || require(_protocolName);

    var _close;

    _server.close = function () {
      /* istanbul ignore else */
      if (_close) {
        _close();
      }
    };

    return new Promise(function (resolve, reject) {
      function done() {
        /* istanbul ignore else */
        if (typeof this !== 'undefined') {
          _close = this.close ? this.close.bind(this) : null;
        }

        Promise.all($.initializers)
          .then(function () { return typeof callback === 'function' && callback(_server, options); })
          .then(function () { return resolve(_server); })
          .catch(reject);
      }

      if (!$.servers[_server.port]) {
        $.servers[_server.port] = serverFactory($, _server, options, done);
      } else {
        done();
      }

      $.hosts[_server.location.host] = _server;
    });
  };
};

var mount = function ($) {
  $.ctx.mount = function (callback) {
    $.pipeline.push(buildFactory(callback, $.otps, 'mount'));
  };
};

var use = function ($) {
  $.ctx.use = function (cb) {
    var task = cb($);

    if (task) {
      $.initializers.push(task);
    }
  };
};

var api = {
  bind: {
    configure: configure,
    dispatch: dispatch,
    listen: listen,
    mount: mount,
    use: use,
  },
  conn: {
    ctx: connFactory,
    host: hostFactory,
    server: serverFactory,
  },
  chain: {
    factory: buildFactory,
    pipeline: _pipelineFactory,
  },
};

module.exports = api;
