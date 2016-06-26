var status_codes = require('http').STATUS_CODES;
var url = require('url');
var qs = require('qs');

function Conn(app, req, res) {
  this.env = process.env.NODE_ENV || 'development';
  this.app = app;
  this.req = req;
  this.res = res;
  this.body = '';
  this.data = {};
  this.path = req.url.split('?')[0];
  this.query = qs.parse(req.url.split('?')[1] || '');
  this.params = {};
  this.method = req.method.toLowerCase();
  this.multipart = null;
}

Conn.prototype = {
  end: function (data) {
    this.res.end(data);
  },
  html: function (data) {
    this.header('content-type', 'text/html; charset=utf-8');
    this.end(data);
  },
  json: function (data) {
    this.header('content-type', 'application/json');
    this.end(JSON.stringify(data));
  },
  header: function (name, value) {
    if (!(name && value)) {
      return this.res.getHeader(name);
    }

    this.res.setHeader(name, value);
  },
  status: function (code, message) {
    this.res.statusCode = code;
    this.res.statusMessage = message || status_codes[code];
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

    this.header('location', _location);
    this.status(statusCode || 302);
    this.end();
  }
};

function parseBody(conn, callback) {
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
}

module.exports = function (app, req, res, callback) {
  parseBody(new Conn(app, req, res), callback);
};
