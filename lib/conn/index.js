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
    set() {
      throw new Error(`Property '${name}' is read-only`);
    },
  });
}

module.exports = (app, req, res) => {
  const _conn = {
    body: null, // output: String Buffer Stream Object
  };

  const _headers = {};

  _set(_conn, 'app', () => app);
  _set(_conn, 'req', () => req);
  _set(_conn, 'res', () => res);

  _set(_conn, 'env', () => process.env.NODE_ENV || 'development');

  _set(_conn, 'query', () => qs.parse(req.url.split('?')[1] || ''));

  _set(_conn, 'input', () => {
    if (!req._body) {
      throw new Error('Request body not ready');
    }

    return req.body;
  });

  _set(_conn, 'type', () => (req.headers['content-type'] || '').split(';')[0]);

  _conn.end = (body) => {
    _conn.body = body || _conn.body || '';

    return _conn;
  };

  _conn.send = (code, message) => {
    /* istanbul ignore else */
    if (_conn.res.finished) {
      throw new Error('Response Already Sent');
    }

    Object.keys(_headers).forEach((key) => {
      _conn.res.setHeader(key.replace(/(^|-)(\w)/g,
        (_, pre, char) => pre + char.toUpperCase()), _headers[key]);
    });

    const _code = typeof code === 'number' ? code : _conn.res.statusCode;
    const _body = typeof code === 'string' ? code : message || _conn.body;

    _conn.status(_code);

    _sendBody(_conn, _body);

    return _conn;
  };

  _conn.get = (name, defvalue) => {
    const _value = _conn.req.headers[name.toLowerCase()];

    /* istanbul ignore else */
    if (typeof _value === 'undefined') {
      return defvalue;
    }

    return _value;
  };

  _conn.set = (name, value, multiple) => {
    /* istanbul ignore else */
    if (typeof name === 'object') {
      Object.keys(name).forEach((key) => {
        _conn.set(key, name[key]);
      });

      return _conn;
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

    return _conn;
  };

  _conn.unset = (keys) => {
    (Array.isArray(keys) ? keys : [keys])
      .forEach((key) => {
        delete _headers[key.toLowerCase()];
      });
  };

  _conn.status = (code) => {
    /* istanbul ignore else */
    if (!statusCodes[code]) {
      throw new Error(`Invalid statusCode: ${code}`);
    }

    _conn.res.statusCode = code;
    _conn.res.statusMessage = statusCodes[code];

    return _conn;
  };

  _conn.redirect = (location) => {
    return _conn
      .end(302)
      .set('location', _fixURL(location));
  };

  return _conn;
};
