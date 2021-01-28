'use strict';

module.exports = Grown => {
  const { WebSocket, Server } = require('mock-socket');
  const { resolve } = require('url');

  return Grown('Test.Sockets', {
    $install(ctx) {
      return {
        methods: {
          sockets(address) {
            address = String(address || 8080);
            if (!address.includes(':')) address = `0.0.0.0:${address}`;
            if (!address.includes('://')) address = `ws://${address}`;

            const wss = new Server(address);

            wss.connect = uri => {
              return new WebSocket(resolve(uri || '/', address));
            };
            return wss;
          },
        },
      };
    },
  });
};
