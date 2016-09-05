const serverFactory = require('../conn/server');
const url = require('url');

module.exports = (context, container) => {
  context.listen = (location, options, callback) => {
    const app = {};

    Object.keys(container.extensions).forEach((key) => {
      app[key] = container.extensions[key];
    });

    // override
    Object.defineProperty(app, 'container', {
      get() {
        return container;
      },
    });

    if (typeof location === 'function') {
      callback = location;
      location = '';
    }

    callback = typeof options == 'function' ? options : callback;
    options = !options || typeof options == 'function' ? {} : options;

    let _protocolName = (typeof options == 'object' && options.cert || options.key || options.ca) ? 'https' : 'http';

    if (typeof location == 'object') {
      app.location = location;
    } else if (!isNaN(location)) {
      app.location = url.parse(`${_protocolName}://0.0.0.0:${location}`);
    } else if (typeof location === 'string') {
      app.location = url.parse(location.indexOf('://') === -1 ? `http://${location}` : location);
    } else if (!location){
      app.location = url.parse(`${_protocolName}://0.0.0.0:80/`);
    }

    app.port = +(app.location.protocol === 'http:' && (options.cert && options.key) ? (app.location.port || 443) : (app.location.port || 80));
    app.location.host = app.location.host.split(':')[1] ? app.location.host : `${app.location.host}:${app.port}`;
    app.host = app.location.host.split(':')[0];

    _protocolName = app.location.protocol.substr(0, app.location.protocol.length - 1);

    context.protocols[_protocolName] = context.protocols[_protocolName] || require(_protocolName);

    let _close;

    app.close = () => {
      /* istanbul ignore else */
      if (_close) {
        _close();
      }
    };

    function done() {
      _close = this.close ? this.close.bind(this) : null;

      /* istanbul ignore else */
      if (typeof callback === 'function') {
        callback(app, options);
      }
    }

    if (!context.servers[app.port]) {
      context.servers[app.port] = serverFactory(app, context, options, done);
    } else {
      done();
    }

    context.hosts[app.location.host] = app;

    return app;
  };
};
