'use strict';

const debug = require('debug')('grown:listen');

const serverFactory = require('../conn/server');

const url = require('url');

module.exports = function $listen(location, options, callback) {
  const _server = {};

  if (typeof location === 'function') {
    callback = location;
    location = '';
  }

  callback = typeof options === 'function' ? options : callback;
  options = !options || typeof options === 'function' ? {} : options;

  let _protocolName = (typeof options === 'object'
    && (options.cert || options.key || options.ca)) ? 'https' : 'http';

  if (typeof location === 'object') {
    _server.location = location;
    _server.location.host = _server.location.host || '';
    _server.location.port = _server.location.port || '80';
    _server.location.protocol = _server.location.protocol || 'http:';
  } else if (!isNaN(location)) {
    _server.location = url.parse(`${_protocolName}://0.0.0.0:${location}`);
  } else if (typeof location === 'string') {
    _server.location = url.parse(location.indexOf('://') === -1 ? `http://${location}` : location);
  } else if (!location) {
    _server.location = url.parse(`${_protocolName}://0.0.0.0:80/`);
  }

  _server.port = +(_server.location.protocol === 'https:' && (options.cert && options.key)
    ? (_server.location.port || 443)
    : (_server.location.port || 80));

  _server.location.host = _server.location.host.split(':')[1]
    ? _server.location.host
    : `${_server.location.host}:${_server.port}`;

  _server.host = _server.location.host.split(':')[0];

  _protocolName = _server.location.protocol.replace(':', '');

  /* istanbul ignore else */
  if (!this._protocols[_protocolName]) {
    this._protocols[_protocolName] = this._ctx
      .extensions(`Conn.${_protocolName}`).new();
  }

  let _close;

  _server.close = () => {
    /* istanbul ignore else */
    if (_close) {
      _close();
    }
  };

  debug('Initializing listener for %s', _server.location.host);

  return new Promise((resolve, reject) => {
    const _listen = () => this._ctx.emit('listen');
    const _done = () => this._ctx.emit('done');

    // build context
    const _app = () => {
      const extensions = this._ctx.extensions('Conn._');

      Object.keys(extensions).forEach(key => {
        /* istanbul ignore else */
        if (typeof _server[key] === 'undefined') {
          _server[key] = extensions[key];
        }
      });

      return _server;
    };

    function done() {
      /* istanbul ignore else */
      if (typeof this !== 'undefined') {
        _close = this.close ? this.close.bind(this) : null;
      }

      _listen()
        .then(() => debug('Done. Starting application'))
        .then(() => {
          /* istanbul ignore else */
          if (typeof callback === 'function') {
            callback(_app(), options);
          }

          resolve(_app());
        })
        .then(() => _done())
        .catch(reject);
    }

    try {
      if (!this._servers[_server.port]) {
        this._servers[_server.port] = serverFactory.call(this, _server, options, done);
      } else {
        debug('Server at port %s already initialized', _server.port);
        done();
      }
    } catch (e) {
      debug('Server was errored: %s', e.message);
      reject(e);
      return;
    }

    debug('Server registered at %s', _server.location.host);

    this._hosts[_server.location.host] = _server;
  });
};
