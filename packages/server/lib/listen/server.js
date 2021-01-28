'use strict';

const debug = require('debug')('grown:listen');

module.exports = function $server(ctx, options, callback) {
  // skipping uWebsockets.js will fallback to standard http(s)
  const useApp = require(process.env.U_WEBSOCKETS_SKIP ? './_http' : './_uws');

  debug('#%s Initializing <%s> protocol', process.pid, ctx.location.protocol);

  return useApp.call(this, ctx, options, callback, ctx.location.protocol.replace(':', ''));
};
