var serverFactory = require('../conn/server');
var url = require('url');

module.exports = function (context) {
  context.listen = function (location, options, callback) {
    var app = {};

    callback = typeof options == 'function' ? options : callback;
    options = !options || typeof options == 'function' ? {} : options;

    var protocolName = (typeof options == 'object' && options.cert || options.key || options.ca) ? 'https' : 'http';

    if (typeof location == 'object') {
      app.location = location;
    } else if (!isNaN(location)) {
      app.location = url.parse(protocolName + '://0.0.0.0:' + location);
    } else if (typeof location === 'string') {
      app.location = url.parse(location.indexOf('://') === -1 ? 'http://' + location : location);
    } else if (!location){
      app.location = url.parse(protocolName + '://0.0.0.0:80/');
    }

    app.port = app.location.protocol === 'http:' && (options.cert && options.key) ? (app.location.port || 443) : (app.location.port || 80);
    app.location.host = app.location.host.split(':')[1] ? app.location.host : app.location.host + ':' + app.port;
    app.host = app.location.host.split(':')[0];

    protocolName = app.location.protocol.substr(0, app.location.protocol.length - 1);

    context.protocols[protocolName] = context.protocols[protocolName] || require(protocolName);

    if (!context.servers[app.port]) {
      context.servers[app.port] = serverFactory(app, context, options, callback);
    } else {
      app.server = context.servers[app.port];

      if (typeof callback === 'function') {
        callback(app, options);
      }
    }

    context.hosts[app.location.host] = app;

    return app;
  };
};
