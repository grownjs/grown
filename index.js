const useFactory = require('./lib/api/use');
const mountFactory = require('./lib/api/mount');
const listenFactory = require('./lib/api/listen');
const dispatchFactory = require('./lib/api/dispatch');

module.exports = (options) => {
  const context = {
    hosts: {},
    servers: {},
    protocols: {},
  };

  const container = {
    options: options || {},
    pipeline: [],
    extensions: {},
  };

  useFactory(context, container);
  mountFactory(context, container);
  listenFactory(context, container);
  dispatchFactory(context, container);

  return context;
};
