const statusCodes = require('http').STATUS_CODES;
const url = require('url');
const qs = require('qs');

function _sendBody(conn, body) {
  /* istanbul ignore else */
  if (typeof body === 'object') {
    conn.res.setHeader('Content-Type', 'application/json');

    body = JSON.stringify(body);
  }

  conn.res.end(body);
}

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

function _set(obj, name, getter) {
  Object.defineProperty(obj, name, {
    get: getter,
  });
}

module.exports = (app, req, res) => {
  const conn = {
    app,
    req,
    res,
    env: process.env.NODE_ENV || 'development',
    body: null, // output: String Buffer Stream Object
  };

  const _headers = {};

  _set(conn, 'query', () => qs.parse(req.url.split('?')[1] || ''));

  _set(conn, 'input', () => {
    if (!req._body) {
      throw new Error('Request body not ready');
    }

    return req.body;
  });

  _set(conn, 'type', () => (req.headers['content-type'] || '').split(';')[0]);

  conn.end = (status, message) => {
    /* istanbul ignore else */
    if (message || status === 'number') {
      return conn.status(status, message);
    }

    conn.body = status || conn.body || '';

    return conn;
  };

  conn.send = (code, message) => {
    /* istanbul ignore else */
    if (conn.res.finished) {
      throw new Error('Response Already Sent');
    }

    Object.keys(_headers).forEach((key) => {
      conn.res.setHeader(key.replace(/(^|-)(\w)/g,
        (_, pre, char) => pre + char.toUpperCase()), _headers[key]);
    });

    const _code = typeof code === 'number' ? code : conn.res.statusCode;
    const _body = typeof code === 'string' ? code : message || conn.body;

    conn.status(_code, conn.res.statusMessage);

    _sendBody(conn, _body);

    return conn;
  };

  conn.get = (name, defvalue) => {
    const _value = conn.req.headers[name.toLowerCase()];

    /* istanbul ignore else */
    if (typeof _value === 'undefined') {
      return defvalue;
    }

    return _value;
  };

  conn.set = (name, value, multiple) => {
    /* istanbul ignore else */
    if (typeof name === 'object') {
      Object.keys(name).forEach((key) => {
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

  conn.unset = (keys) => {
    (Array.isArray(keys) ? keys : [keys])
      .forEach((key) => {
        delete _headers[key.toLowerCase()];
      });
  };

  conn.status = (code, message) => {
    /* istanbul ignore else */
    if (!statusCodes[code]) {
      throw new Error(`Invalid statusCode: ${code}`);
    }

    conn.res.statusCode = code;
    conn.res.statusMessage = message || statusCodes[code];

    return conn;
  };

  conn.redirect = (location, statusCode) => {
    return conn
      .end(typeof statusCode === 'number' ? statusCode : 302)
      .end(conn.body || conn.res.statusMessage || '')
      .set('location', _fixURL(location));
  };

  return conn;
};
