'use strict';

/* istanbul ignore file */

const path = require('path');

const USAGE_INFO = `

  Runs the app-server

  -p, --port   Optional. Server's port (default: 8080)
  -h, --host   Optional. Server's host name (default: 0.0.0.0)
      --https  Optional. Force HTTPS

  Examples:
    {bin} up 8081            # Use port 8081
    {bin} up --https         # Use https:// protocol
    {bin} up 127.0.0.1:8081  # Custom host name and port

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown) {
    const app = process.main || Grown.argv.flags.app || 'app.js';

    let serverFactory;
    try {
      serverFactory = require(path.resolve(Grown.cwd, app));
    } catch (e) {
      throw new Error(`Failed to load application, given '${app}'`);
    }

    if (typeof serverFactory !== 'function') {
      throw new Error(`Invalid application, given '${typeof serverFactory}'`);
    }

    const server = serverFactory();

    if (!server || typeof server.listen !== 'function') {
      throw new Error(`Missing listen() method, given '${typeof (server ? server.listen : server)}'`);
    }

    let _protocol = 'http';

    /* istanbul ignore else */
    if (Grown.argv.flags.https === true) {
      _protocol += 's';
    }

    /* istanbul ignore else */
    if (Grown.argv._[1]) {
      const _address = Grown.argv._[1].split(':');

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
