'use strict';

module.exports = Grown => {
  const { WebSocket, Server } = require('mock-socket');
  const { resolve } = require('url');

  return Grown('Test.Sockets', {
    $install(ctx, scope) {
      return {
        methods: {
          sockets(address) {
            address = String(address || 8080);
            if (!address.includes(':')) address = `0.0.0.0:${address}`;
            if (!address.includes('://')) address = `ws://${address}`;

            const wss = new Server(address);

            wss.on('connection', ws => {
              scope._events.emit('open', ws);

              ws.on('close', () => {
                scope._events.emit('close', ws);
              });
            });

            wss.connect = uri => {
              const ws = new WebSocket(resolve(uri || '/', address));

              ws.on = ws.addEventListener.bind(ws);
              ws.off = ws.removeEventListener.bind(ws);
              ws.emit = ws.dispatchEvent.bind(ws);
              ws.once = (e, cb) => {
                const fn = (...args) => {
                  try {
                    cb(...args);
                  } finally {
                    ws.off(e, fn);
                  }
                };
                ws.on(e, fn);
              };
              return ws;
            };

            Object.defineProperty(ctx, 'clients', {
              value: () => wss.clients(),
            });

            return wss;
          },
        },
      };
    },
  });
};
