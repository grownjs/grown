var status_codes = require('http').STATUS_CODES;
var url = require('url');
var qs = require('qs');

function _get(obj, from) {
  Object.keys(from).forEach(function (key) {
    Object.defineProperty(obj, key, {
      get: from[key]
    });
  });
}

function _set(obj, from) {
  Object.keys(from).forEach(function (key) {
    obj[key] = from[key];
  });
}

module.exports = function (app, req, res, callback) {
  var conn = {
    env: process.env.NODE_ENV || 'development',
    app: app,
    req: req,
    res: res,
    body: '',
    data: {},
    params: {},
    multipart: null
  };

  _get(conn, {
    path: function () {
      return req.url.split('?')[0];
    },
    query: function () {
      return qs.parse(req.url.split('?')[1] || '');
    }
  });

  _set(conn, {
    end: function (data) {
      res.end(data);
    },
    html: function (data) {
      conn.header('content-type', 'text/html; charset=utf-8');
      conn.end(data);
    },
    json: function (data) {
      conn.header('content-type', 'application/json');
      conn.end(JSON.stringify(data));
    },
    header: function (name, value) {
      if (!(name && value)) {
        return res.getHeader(name);
      }

      res.setHeader(name, value);
    },
    status: function (code, message) {
      res.statusCode = code;
      res.statusMessage = message || status_codes[code];
    },
    redirect: function (location, statusCode) {
      var _uri = url.parse(location);
      var _query = '';

      if (_uri.query) {
        _query = qs.stringify(qs.parse(_uri.query));
      }

      var _location = [
        _uri.protocol ? _uri.protocol + '//' : '',
        _uri.hostname ? _uri.hostname : '',
        _uri.port ? ':' + _uri.port : '',
        _uri.pathname ? _uri.pathname : '',
        _query ? '?' + _query : ''
      ].join('');

      conn.header('location', _location);
      conn.status(statusCode || 302);
      conn.end();
    }
  });

  if (conn.path.length > 1 && conn.req.headers['content-type'] || conn.req.headers['transfer-encoding']) {
    conn.body = '';

    var _type = conn.req.headers['content-type'] ? conn.req.headers['content-type'].toString() : '';
    var _multipart = _type.indexOf('multipart/form-data');

    if (_multipart === -1) {
      conn.req.on('data', function (data) {
        conn.body += data;
      });

      conn.req.on('end', function () {
        if (_type === 'application/json') {
          try {
            conn.body = JSON.parse(conn.body);
          } catch (error) {
            // TODO: proper handling?
          }
        } else if (_type.indexOf('application/x-www-form-urlencoded') > -1) {
          conn.body = qs.parse(conn.body);
        }

        conn.multipart = false;
        callback(conn);
      });
    } else {
      conn.multipart = true;
      callback(conn);
    }
  } else {
    callback(conn);
  }
};
