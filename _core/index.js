if (typeof Promise === 'undefined') {
  global.Promise = require('es6-promise').Promise;
}

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
    pipeline: [],
    extensions: {}
  };

  useFactory(context, container);
  mountFactory(context, container);
  listenFactory(context, container);
  dispatchFactory(context, container);

  return context;
};
