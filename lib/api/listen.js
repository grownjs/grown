'use strict';

const serverFactory = require('../conn/server');
const url = require('url');

module.exports = (container) => {
  container._context.listen = (location, options, callback) => {
    const _context = container._context;
    const _server = {};

    Object.keys(container.extensions).forEach((key) => {
      _server[key] = container.extensions[key];
    });

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
      _server.location.protocol = _server.location.protocol || 'http';
    } else if (!isNaN(location)) {
      _server.location = url.parse(`${_protocolName}://0.0.0.0:${location}`);
    } else if (typeof location === 'string') {
      _server.location = url.parse(location.indexOf('://') === -1 ? `http://${location}` : location);
    } else if (!location) {
      _server.location = url.parse(`${_protocolName}://0.0.0.0:80/`);
    }

    _server.port = +(_server.location.protocol === 'http:' && (options.cert && options.key)
      ? (_server.location.port || 443)
      : (_server.location.port || 80));

    _server.location.host = _server.location.host.split(':')[1]
      ? _server.location.host
      : `${_server.location.host}:${_server.port}`;

    _server.host = _server.location.host.split(':')[0];

    _protocolName = _server.location.protocol.replace(':', '');

    /* eslint-disable global-require */
    _context.protocols[_protocolName]
      = _context.protocols[_protocolName] || require(_protocolName);

    let _close;

    _server.close = () => {
      /* istanbul ignore else */
      if (_close) {
        _close();
      }
    };

    function done() {
      /* istanbul ignore else */
      if (typeof this !== 'undefined') {
        _close = this.close ? this.close.bind(this) : null;
      }

      Promise.all(container.initializers).then(() => {
        /* istanbul ignore else */
        if (typeof callback === 'function') {
          callback(_server, options);
        }
      }).catch((e) => {
        // TODO: send to logger
        console.log(e);
      });
    }

    if (!_context.servers[_server.port]) {
      _context.servers[_server.port] = serverFactory(_server, options, container, done);
    } else {
      done();
    }

    _context.hosts[_server.location.host] = _server;

    return _server;
  };
};
