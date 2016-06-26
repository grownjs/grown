var useFactory = require('./lib/api/use');
var mountFactory = require('./lib/api/mount');
var listenFactory = require('./lib/api/listen');
var dispatchFactory = require('./lib/api/dispatch');

module.exports = function (options) {
  var context = {
    hosts: {},
    servers: {},
    protocols: {}
  };

  var container = {
    options: options || {},
    pipeline: [{
      name: '_end',
      call: function () {
        var _err = new Error('Not Implemented');
        _err.statusCode = 501;
        throw _err;
      }
    }]
  };

  useFactory(context, container);
  mountFactory(context, container);
  listenFactory(context, container);
  dispatchFactory(context, container);

  return context;
};
