'use strict';

/* eslint-disable global-require */

const debug = require('../debug')('homwgrown:socket');

module.exports = (port) => {
  /* istanbul ignore else */
  if (!port) {
    throw new Error(`Expecting 'port' to be a valid number, given '${port}'`);
  }

  return $ => {
    const _sockets = {};

    const io = require('socket.io')(port);

    $.on('close', () => {
      Object.keys(_sockets).forEach((key) => {
        if (_sockets[key]) {
          _sockets[key].disconnect(true);
        }
      });

      io.close();
    });

    $.extensions('Grown.conn', {
      props: {
        socket_host() {
          return `//localhost:${port}`;
        },
      },
      methods: {
        socket(path) {
          return new Promise((resolve, reject) => {
            /* istanbul ignore else */
            if (_sockets[path] === null) {
              debug('Pending connection for %s', path);
              setTimeout(() => resolve(this.socket(path)), 100);
              return;
            }

            /* istanbul ignore else */
            if (_sockets[path]) {
              debug('Aquired connection for %s', path);
              resolve(_sockets[path]);
              return;
            }

            _sockets[path] = null;

            try {
              debug('Creating connection for %s', path);

              io.of(path).on('connection', (socket) => {
                debug('Connection for %s was created', path);

                _sockets[path] = socket;
                resolve(socket);
              });
            } catch (e) {
              reject(e);
            }
          });
        },
      },
    });
  };
};
