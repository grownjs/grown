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
    pipeline: []
  };

  mountFactory(context, container);
  listenFactory(context, container);
  dispatchFactory(context, container);

  return context;
};
