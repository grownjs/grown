'use strict';

/* eslint-disable global-require */

const debug = require('debug')('grown:socket');

module.exports = port => {
  /* istanbul ignore else */
  if (!port) {
    throw new Error(`Expecting 'port' to be a valid number, given '${port}'`);
  }

  return $ => {
    const _channels = {};

    const io = require('socket.io')(port);

    $.channel = path =>
      new Promise((resolve, reject) => {
        /* istanbul ignore else */
        if (_channels[path] === null) {
          debug('Pending connection for %s', path);
          setTimeout(() => resolve($.socket(path)), 100);
          return;
        }

        /* istanbul ignore else */
        if (_channels[path]) {
          debug('Aquired connection for %s', path);
          resolve(_channels[path]);
          return;
        }

        _channels[path] = null;

        try {
          debug('Creating connection for %s', path);

          io.of(path).on('connection', socket => {
            debug('Connection for %s was created', path);

            _channels[path] = socket;
            resolve(socket);
          });
        } catch (e) {
          reject(e);
        }
      });

    $.on('close', () => {
      Object.keys(_channels).forEach(key => {
        /* istanbul ignore else */
        if (_channels[key]) {
          _channels[key].disconnect(true);
        }
      });

      io.close();
    });

    $.extensions('Conn', {
      props: {
        socket_host() {
          return `//localhost:${port}`;
        },
      },
      methods: {
        channel: $.channel,
      },
    });
  };
};
