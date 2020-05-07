'use strict';

const debug = require('debug')('grown:listen');

const qs = require('querystring');
const uWS = require('uWebSockets.js');

const $host = require('./host');

const {
  readBody,
  ServerRequest,
  ServerResponse,
} = require('./_uws');

module.exports = function $server(ctx, options, callback) {
  debug('#%s Initializing <%s> protocol', process.pid, ctx.location.protocol);

  const protocolName = ctx.location.protocol.replace(':', '');

  let app;
  if (protocolName === 'https') {
    app = uWS.SSLApp(options.https);
  } else {
    app = uWS.App();
  }

  this.close = () => uWS.us_listen_socket_close(app._self);

  app.listen(ctx.host, ctx.port, socket => {
    debug('#%s Server was started and listening at port', process.pid, ctx.port);

    app._self = socket;
    app.any('/*', (res, req) => {
      req.headers = { host: ctx.host };
      req.forEach((k, v) => {
        req.headers[k] = v;
      });

      const _req = new ServerRequest(req);
      const _resp = new ServerResponse(res);

      const next = (data, cb) => {
        if (typeof data === 'string') {
          _req.body = cb(data);
          _req._body = true;
        }

        $host.call(this, ctx.location, _req, _resp);
      };

      const type = req.getHeader('content-type');

      if (type.includes('/json')) {
        readBody(req, res, data => next(data, JSON.parse));
      } else if (type.includes('/x-www-form-urlencoded')) {
        readBody(req, res, data => next(data, qs.parse));
      } else {
        next();
      }
    });

    callback.call(this);
  });
};
