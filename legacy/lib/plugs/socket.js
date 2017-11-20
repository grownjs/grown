'use strict';

const debug = require('debug')('grown:socket');

module.exports = defaults => {
  defaults = defaults || {};

  return $ => {
    const _channels = {};

    const io = require('socket.io')(defaults.server !== true
      ? $.server(defaults.port)
      : defaults.port);

    function channel(path) {
      return new Promise((resolve, reject) => {
        /* istanbul ignore else */
        if (!io) {
          throw new Error('Missing connection for sockets');
        }

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
    }

    $.extensions('Conn._', { channel }, false);

    $.extensions('Conn', {
      props: {
        socket_host() {
          return `//${defaults.host || 'localhost'}${
            !defaults.port
              || defaults.port === 80
              || defaults.port === 443 ? '' : `:${defaults.port}`
          }`;
        },
      },
      methods: {
        channel,
      },
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
  };
};
