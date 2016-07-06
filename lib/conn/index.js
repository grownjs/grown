var IncomingForm = require('formidable').IncomingForm;
var status_codes = require('http').STATUS_CODES;
var methods = require('http').METHODS;
var url = require('url');
var qs = require('qs');

function _parseBody(conn, callback) {
  var _multipart = conn.type.indexOf('multipart/form-data');

  if (_multipart === -1) {
    var _input = '';

    conn.req.on('data', function (data) {
      _input += data;
    });

    conn.req.on('end', function () {
      if (conn.type === 'application/json') {
        try {
          _input = JSON.parse(_input);
        } catch (error) {
          // TODO: proper handling?
        }
      } else /* istanbul ignore else */ if (conn.type.indexOf('application/x-www-form-urlencoded') > -1) {
        _input = qs.parse(_input);
      }

      conn.input = _input;
      callback();
    });
  } else {
    // TODO: how configure this?
    var form = new IncomingForm();

    form.parse(conn.req, function (err, fields, uploads) {
      /* istanbul ignore else */
      if (err) {
        throw err;
      }

      // merge form-fields with input
      Object.keys(fields).forEach(function (key) {
        conn.input[key] = fields[key];
      });

      // reference uploaded files
      conn.files = uploads;

      callback();
    });
  }
}

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

function newConn(app, req, res) {
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
}

module.exports = function _conn(app, req, res, callback) {
  var conn = newConn(app, req, res);

  function next() {
    req.originalMethod = req.originalMethod || req.method;

    /* istanbul ignore else */
    if (req.originalMethod === 'POST') {
      var _method = (conn.get('x-http-method-override') || conn.get('x-method-override')
        || conn.get('x-http-method') || conn.get('_method')
        || '').split(/ *, */)[0];

      _method = (_method || conn.input._method || conn.query._method || '').toUpperCase();

      /* istanbul ignore else */
      if (methods.indexOf(_method) > -1) {
        req.method = _method;
      }

      delete conn.input._method;
      delete conn.query._method;
    }

    callback(conn);
  }

  if (conn.type || conn.get('transfer-encoding') || req.method === 'POST') {
    _parseBody(conn, next);
  } else {
    next();
  }
};
