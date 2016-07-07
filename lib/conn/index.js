var status_codes = require('http').STATUS_CODES;
var url = require('url');
var qs = require('qs');

function _sendBody(conn, code, body) {
  /* istanbul ignore else */
  if (typeof body === 'object') {
    conn.res.setHeader('Content-Type', 'application/json');

    body = JSON.stringify(body);
  }

  conn.res.statusCode = code;
  conn.res.end(body);
}

function _fixURL(location) {
  var _uri = url.parse(location);
  var _query = '';

  /* istanbul ignore else */
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

module.exports = function (app, req, res) {
  var conn = {
    env: process.env.NODE_ENV || 'development',
    app: app,
    req: req,
    res: res,
    body: null, // output: String Buffer Stream Object
    input: {}, // input-form or body-parsed params
    files: {}, // formidable uploaded files
    type: (req.headers['content-type'] || '').split(';')[0],
    query: qs.parse(req.url.split('?')[1] || '')
  };

  var _headers = {};

  conn.end = function () {
    /* istanbul ignore else */
    if (arguments.length === 2 || typeof arguments[0] === 'number') {
      return conn.status.apply(null, arguments);
    }

    conn.body = arguments[0] || conn.body || '';

    return conn;
  };

  conn.send = function (code, message) {
    /* istanbul ignore else */
    if (conn.res.finished) {
      throw new Error('Response Already Sent');
    }

    Object.keys(_headers).forEach(function (key) {
      var _key = key.replace(/(^|-)(\w)/g, function (_, pre, char) {
        return pre + char.toUpperCase();
      });

      conn.res.setHeader(_key, _headers[key]);
    });

    var _code = typeof code === 'number' ? code : conn.res.statusCode;
    var _body = typeof code === 'string' ? code : message || conn.body;

    _sendBody(conn, _code, _body);

    return conn;
  };

  conn.get = function (name, defvalue) {
    var _value = conn.req.headers[name.toLowerCase()];

    /* istanbul ignore else */
    if (typeof _value === 'undefined') {
      _value = defvalue;
    }

    return _value;
  };

  conn.set = function (name, value, multiple) {
    /* istanbul ignore else */
    if (typeof name === 'object') {
      Object.keys(name).forEach(function (key) {
        conn.set(key, name[key]);
      });

      return conn;
    }

    if (multiple === true) {
      _headers[name] = _headers[name] || [];

      /* istanbul ignore else */
      if (!Array.isArray(_headers[name])) {
        _headers[name] = [_headers[name]];
      }

      _headers[name].push(value);
    } else {
      _headers[name] = value;
    }

    return conn;
  };

  conn.unset = function (keys) {
    (Array.isArray(keys) ? keys : Array.prototype.slice.call(arguments))
      .forEach(function (key) {
        delete _headers[key.toLowerCase()];
      });
  };

  conn.status = function (code, message) {
    /* istanbul ignore else */
    if (!status_codes[code]) {
      throw new Error('Invalid statusCode: ' + code);
    }

    conn.res.statusCode = code;
    conn.res.statusMessage = message || status_codes[code];

    return conn;
  };

  conn.redirect = function (location, statusCode) {
    return conn
      .end(typeof statusCode === 'number' ? statusCode : 302)
      .end(conn.body || conn.res.statusMessage || '')
      .set('location', _fixURL(location));
  };

  return conn;
};
