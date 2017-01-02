var version = "0.1.0";

var useFactory = function ($) {
  $.ctx.use = function (cb) {
    var task = cb($);

    if (task) {
      $.initializers.push(task);
    }
  };
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

var mountFactory = function ($) {
  $.ctx.mount = function (callback) {
    $.pipeline.push(buildFactory(callback, $.otps, 'mount'));
  };
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
        return obj[key];
      },
      set: function set() {
        throw new Error(("Property '" + key + "' is read-only"));
      },
    });
  });
}

// inject dynamic getter/setter properties
function _props(target, state, keys) {
  keys.forEach(function (key) {
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: true,
      get: function get() {
        return state[key];
      },
      set: function set(value) {
        state[key] = value;
      },
    });
  });
}

var connFactory = function (container, server, req, res) {
  var $ = _extend({}, container.extensions);

  var _state = {
    finished: false,
    charset: 'utf8',
    headers: {},
    status: 200,
    body: '',
  };

  function _send() {
    // normalize response haders
    Object.keys(_state.headers).forEach(function (key) {
      $.res.setHeader(key.replace(/(^|-)(\w)/g,
        function (_, pre, char) { return pre + char.toUpperCase(); }), _state.headers[key]);
    });

    // normalize response body
    var _output = _state.body;

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
    req: req,
    res: res,

    // current environment
    env: process.env.NODE_ENV || 'dev',

    // current connection
    host: server.location.host,
    port: server.location.port,
    method: 'GET',
    path_info: function () { return req.url.split('?')[0].split('/').filter(function (x) { return x; }); },
    script_name: path.relative(process.cwd(), process.argv[1]),
    request_path: function () { return req.url.split('?')[0]; },
    remote_ip: '0.0.0.0',
    req_headers: function () { return req.headers; },
    type: (req.headers['content-type'] || '').split(';')[0],
    scheme: server.location.scheme,
    path_params: function () { return req.params || {}; },
    body_params: function () { return req.body || {}; },
    query_string: function () { return req.url.split('?')[1]; },
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
      _state.status = typeof _code === 'number' ? _code : $.res.statusCode;

      // normalize given output
      _state.body = typeof _code === 'string' ? _code : message || _state.body;

      _send();

      return $;
    },

    send_resp: function send_resp() {
      _end();
      _send();

      return $;
    },

    // get request headers by name
    get_req_header: function get_req_header(name, defvalue) {
      var _value = $.req.headers[name.toLowerCase()];

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
    delete_resp_header: function delete_resp_header(keys) {
      (Array.isArray(keys) ? keys : [keys])
        .forEach(function (key) {
          delete _state.headers[key.toLowerCase()];
        });

      return $;
    },

    // handle redirections
    redirect: function redirect(location) {
      _end();

      $.status(302);
      $.put_resp_header('location', _fixURL(location));

      _send();

      return $;
    },

    // response status
    status: function status(code) {
      /* istanbul ignore else */
      if (!statusCodes[code]) {
        throw new Error(("Invalid statusCode: " + code));
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
    'resp_headers' ]);

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

var listenFactory = function ($) {
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

          if (!result.halted) {
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

        Object.defineProperty(state, 'next', {
          configurable: false,
          enumerable: true,
          set: function set() {
            throw new Error("Property 'next' is read-only");
          },
          get: function get(_resume) {
            /* istanbul ignore else */
            if (!_pipeline.length) {
              return _when(Promise.resolve(state), _resume);
            }

            var _dispatch = _pipelineFactory(cb.name, _pipeline.slice());

            _pipeline = [];

            return _when(_dispatch(state, options), _resume);
          },
        });

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
  if (conn.res._hasBody && conn.res._headerSent) {
    conn.res.end();
    return;
  }

  /* istanbul ignore else */
  var errObj = err || new Error('Not Implemented');

  errObj.statusMessage = errObj.statusMessage || errObj.message;
  errObj.statusCode = errObj.statusCode || 501;

  throw errObj;
}

var dispatchFactory = function ($) {
  $.ctx.dispatch = _pipelineFactory('_dispatch', $.pipeline, _dispatch);
};

var _env = require('dotenv');

var configureFactory = function ($) {
  $.ctx.configure = function (_opts) { return _env.config(_opts || { silent: true }); };
};

/*
*/

var FARMS = [];

function _closeAll() {
  FARMS.forEach(function (farm) {
    Object.keys(farm.hosts).forEach(function (host) {
      farm.hosts[host].close();
    });
  });
}

// gracefully dies
process.on('exit', _closeAll);
process.on('SIGINT', function () { return process.exit(); });

var index = {
  version: version,

  new: function new$1(defaults) {
    if ( defaults === void 0 ) defaults = {};

    var $ = {
      ctx: {},
      opts: {},

      hosts: {},
      servers: {},
      protocols: {},

      pipeline: [],
      extensions: {},
      initializers: [],
    };

    Object.keys(defaults).forEach(function (key) {
      $.opts[key] = defaults[key];
    });

    FARMS.push($);

    useFactory($);
    mountFactory($);
    listenFactory($);
    dispatchFactory($);
    configureFactory($);

    return $;
  },

  burn: function burn() {
    _closeAll();
  },

  farms: function farms(cb) {
    FARMS.forEach(cb);
  },
};

module.exports = index;
