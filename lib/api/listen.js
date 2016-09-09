'use strict';

const serverFactory = require('../conn/server');
const url = require('url');

module.exports = (context, container) => {
  context.listen = (location, options, callback) => {
    const _context = {};

    Object.keys(container.extensions).forEach((key) => {
      _context[key] = container.extensions[key];
    });

    // always override
    _context.container = container;

    if (typeof location === 'function') {
      callback = location;
      location = '';
    }

    callback = typeof options === 'function' ? options : callback;
    options = !options || typeof options === 'function' ? {} : options;

    let _protocolName = (typeof options === 'object'
      && (options.cert || options.key || options.ca)) ? 'https' : 'http';

    if (typeof location === 'object') {
      _context.location = location;
    } else if (!isNaN(location)) {
      _context.location = url.parse(`${_protocolName}://0.0.0.0:${location}`);
    } else if (typeof location === 'string') {
      _context.location = url.parse(location.indexOf('://') === -1 ? `http://${location}` : location);
    } else if (!location) {
      _context.location = url.parse(`${_protocolName}://0.0.0.0:80/`);
    }

    _context.port = +(_context.location.protocol === 'http:' && (options.cert && options.key)
      ? (_context.location.port || 443)
      : (_context.location.port || 80));

    _context.location.host = _context.location.host.split(':')[1]
      ? _context.location.host
      : `${_context.location.host}:${_context.port}`;

    _context.host = _context.location.host.split(':')[0];

    _protocolName = _context.location.protocol.substr(0, _context.location.protocol.length - 1);

    /* eslint-disable global-require */
    context.protocols[_protocolName] = context.protocols[_protocolName] || require(_protocolName);

    let _close;

    _context.close = () => {
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

      /* istanbul ignore else */
      if (typeof callback === 'function') {
        callback(_context, options);
      }
    }

    if (!context.servers[_context.port]) {
      context.servers[_context.port] = serverFactory(_context, context, options, done);
    } else {
      done();
    }

    context.hosts[_context.location.host] = _context;

    return _context;
  };
};
