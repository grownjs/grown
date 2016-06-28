var status_codes = require('http').STATUS_CODES;
var methods = require('http').METHODS;
var url = require('url');
var qs = require('qs');

function _parseBody(conn, callback) {
  conn.input = '';

  var _multipart = conn.type.indexOf('multipart/form-data');

  if (_multipart === -1) {
    conn.req.on('data', function (data) {
      conn.input += data;
    });

    conn.req.on('end', function () {
      if (conn.type === 'application/json') {
        try {
          conn.input = JSON.parse(conn.input);
        } catch (error) {
          // TODO: proper handling?
        }
      } else if (conn.type.indexOf('application/x-www-form-urlencoded') > -1) {
        conn.input = qs.parse(conn.input);
      }

      conn.multipart = false;
      callback(conn);
    });
  } else {
    conn.multipart = true;
    callback(conn);
  }
}

function _fixURL(location) {
  var _uri = url.parse(location);
  var _query = '';

  if (_uri.query) {
    _query = qs.stringify(qs.parse(_uri.query));
  }

  return [
    _uri.protocol ? _uri.protocol + '//' : '',
    _uri.hostname ? _uri.hostname : '',
    _uri.port ? ':' + _uri.port : '',
    _uri.pathname ? _uri.pathname : '',
    _query ? '?' + _query : ''
  ].join('');
}

function newConn(app, req, res) {
  var conn = {
    env: process.env.NODE_ENV || 'development',
    app: app,
    req: req,
    res: res,
    body: null, // output: String Buffer Stream Object
    input: {}, // input-form or body-parsed params
    multipart: null,
    type: req.headers['content-type'] || '',
    query: qs.parse(req.url.split('?')[1] || '')
  };

  var _headers = {};

  function _pending() {
    if (conn.res.finished) {
      throw new Error('Conn Already Finished');
    }
  }

  conn.end = function () {
    _pending();

    if (arguments.length === 2) {
      conn.status.apply(null, arguments);
    }

    if (arguments.length === 1) {
      conn.body = arguments[0];
    }

    return conn;
  };

  conn.send = function (code, message) {
    _pending();

    Object.keys(_headers).forEach(function (key) {
      conn.res.setHeader(key, _headers[key]);
    });

    var _code = typeof code === 'number' ? code : conn.res.statusCode;
    var _body = typeof code !== 'number' ? code : message || code || conn.body;

    if (typeof _body === 'object') {
      conn.res.setHeader('Content-Type', 'application/json');

      _body = JSON.stringify(_body);
    }

    conn.status(_code);
    conn.res.end(_body);

    return conn;
  };

  conn.get = function (name, defvalue) {
    var _value = conn.req.headers[name.toLowerCase()];

    if (typeof _value === 'undefined') {
      return defvalue;
    }

    return _value;
  };

  conn.set = function (name, value, multiple) {
    _pending();

    if (typeof name === 'object') {
      Object.keys(name).forEach(function (key) {
        conn.set(key, name[key]);
      });

      return conn;
    }

    var _key = name.replace(/(^|-)(\w)/g, function (_, pre, char) {
      return pre + char.toUpperCase();
    });

    if (multiple === true) {
      _headers[_key] = _headers[_key] || [];

      if (!Array.isArray(_headers[_key])) {
        _headers[_key] = [_headers[_key]];
      }

      _headers[_key].push(value);
    } else {
      _headers[_key] = value;
    }

    return conn;
  };

  conn.unset = function (keys) {
    _pending();

    (Array.isArray(keys) ? keys : Array.prototype.slice.call(arguments))
      .forEach(function (key) {
        delete _headers[key.toLowerCase()];
      });
  };

  conn.status = function (code, message) {
    _pending();

    if (!status_codes[code]) {
      throw new Error('Invalid statusCode: ' + code);
    }

    conn.res.statusCode = code;
    conn.res.statusMessage = message || conn.res.statusMessage || status_codes[code];

    return conn;
  };

  conn.redirect = function (location, statusCode) {
    _pending();

    return conn
      .set('location', _fixURL(location))
      .end(typeof statusCode === 'number' ? statusCode : 302);
  };

  return conn;
}

module.exports = function _conn(app, req, res, callback) {
  var conn = newConn(app, req, res);

  req.originalMethod = req.originalMethod || req.method;

  if (req.originalMethod === 'POST') {
    var _method = (conn.get('x-http-method-override') || conn.get('x-method-override')
      || conn.get('x-http-method') || conn.get('_method')
      || '').split(/ *, */)[0];

    _method = (_method || conn.input._method || conn.query._method || '').toUpperCase();

    if (methods.indexOf(_method) > -1) {
      req.method = _method;
    }
  }

  delete conn.input._method;
  delete conn.query._method;

  if (conn.type || conn.get('transfer-encoding')) {
    _parseBody(conn, callback);
  } else {
    callback(conn);
  }
};
