'use strict';

const path = require('path');

const USAGE_INFO = `

Start the server

-p, --port   Optional. Server's port (default: 8080)
-h, --host   Optional. Server's host name (default: 0.0.0.0)
    --https  Optional. Force HTTPS

Examples:
  grown up 8081            # Use port 8081
  grown up --https         # Use https:// protocol
  grown up 127.0.0.1:8081  # Custom host name and port

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown) {
    const serverFactory = require(path.resolve(Grown.cwd, Grown.argv.flags.app));
    const server = serverFactory();

    let _protocol = 'http';

    /* istanbul ignore else */
    if (Grown.argv.flags.https === true) {
      _protocol += 's';
    }

    /* istanbul ignore else */
    if (Grown.argv._[0]) {
      const _address = Grown.argv._.shift().split(':');

      if (_address[0].indexOf('.') === -1) {
        process.env.PORT = _address[0];
      } else {
        process.env.HOST = _address[0] || process.env.HOST;
        process.env.PORT = _address[1] || process.env.PORT;
      }
    }

    server.listen(`${_protocol}://${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 8080}`);
  },
};
