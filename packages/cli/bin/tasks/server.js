'use strict';

/* istanbul ignore file */

const path = require('path');
const fs = require('fs');

const USAGE_INFO = `

  Application server tasks

  If no hook is given it'll display server information.

  --grep    Optional. Filter out routes matching the given term
  --get     Optional. Filter out GET routes only
  --post    Optional. Filter out POST routes only
  --put     Optional. Filter out PUT routes only
  --patch   Optional. Filter out PATCH routes only
  --delete  Optional. Filter out DELETE routes only

  Hooks:
    __HOOKS__

`;

const EXEC_TASK = `

  Execute arbitrary scripts

  --load  Optional. Load module before the script

  Examples:
    {bin} server exec path/to/script other/script
    {bin} server exec --load api/models path/to/script

`;

const START_TASK = `

  Runs the application server

  -a, --app    Optional. Entry file (default: app.js)
  -p, --port   Optional. Server's port (default: 8080)
  -h, --host   Optional. Server's host name (default: 0.0.0.0)
      --https  Optional. Force HTTPS

  Examples:
    {bin} server start 8081            # Use port 8081
    {bin} server start --https         # Use https:// protocol
    {bin} server start 127.0.0.1:8081  # Custom host name and port

`;

module.exports = {
  description: USAGE_INFO,
  configure(Grown) {
    Grown.CLI.define('server:exec', EXEC_TASK, ({ util }) => {
      const load = util.flattenArgs(Grown.argv.flags.load).filter(Boolean);
      const run = Grown.argv._.slice(2);

      /* istanbul ignore else */
      if (!run.length) {
        throw new Error('Missing script(s)');
      }

      function locate(mod) {
        return require(fs.existsSync(mod) ? path.resolve(mod) : mod);
      }

      load.forEach(src => {
        Grown.use(locate(src));
      });

      return Promise.resolve()
        .then(() => run.reduce((prev, task) => prev.then(() => locate(task)(Grown, util)), Promise.resolve()))
        .catch(e => {
          Grown.Logger.getLogger()
            .printf('\r{% error. %s %}\n', (Grown.argv.flags.verbose && e.stack) || e.message);
        });
    });

    Grown.CLI.define('server:start', START_TASK, ({ server }) => {
      /* istanbul ignore else */
      if (!server || typeof server.listen !== 'function') {
        throw new Error(`Missing listen() method, given '${typeof server}'`);
      }

      let _protocol = 'http';

      /* istanbul ignore else */
      if (Grown.argv.flags.https === true) {
        _protocol += 's';
      }

      /* istanbul ignore else */
      if (Grown.argv._[2]) {
        const _address = Grown.argv._[2].split(':');

        if (_address[0].indexOf('.') === -1) {
          process.env.PORT = _address[0];
        } else {
          process.env.HOST = _address[0] || process.env.HOST;
          process.env.PORT = _address[1] || process.env.PORT;
        }
      }

      server.listen(`${_protocol}://${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 8080}`);
    });
  },
  callback(Grown, util) {
    const serverFactory = require(path.resolve(Grown.cwd, process.main || Grown.argv.flags.app || 'app.js'));
    const server = typeof serverFactory === 'function' ? serverFactory() : serverFactory;
    const tasks = Grown.CLI.subtasks('server');

    /* istanbul ignore else */
    if (tasks[Grown.argv._[1]]) {
      return tasks[Grown.argv._[1]].callback({ util, server });
    }

    Grown.Logger.getLogger().printf('Server info');

    if (server.router && server.router.routes.length > 0) {
      let found;
      server.router.routes.forEach(route => {
        /* istanbul ignore else */
        if (
          typeof Grown.argv.flags.grep === 'string'
          && !route.handler.concat([route.as, route.path, route.verb]).join(' ').toLowerCase().includes(Grown.argv.flags.grep.toLowerCase())
        ) return;

        /* istanbul ignore else */
        if (Grown.argv.flags.get && route.verb !== 'GET') return;
        /* istanbul ignore else */
        if (Grown.argv.flags.post && route.verb !== 'POST') return;
        /* istanbul ignore else */
        if (Grown.argv.flags.put && route.verb !== 'PUT') return;
        /* istanbul ignore else */
        if (Grown.argv.flags.patch && route.verb !== 'PATCH') return;
        /* istanbul ignore else */
        if (Grown.argv.flags.delete && route.verb !== 'DELETE') return;

        found = true;
        Grown.Logger.getLogger().printf('\n%s %s  {%gray. (%s: %s) %}', `   ${route.verb}`.substr(-6), route.path, route.as, route.handler.join('#'));
      });

      /* istanbul ignore else */
      if (!found) {
        Grown.Logger.getLogger().printf('\n  {%gray. # no matching routes %}');
      }
    } else {
      Grown.Logger.getLogger().printf('\n  {%gray. # without routes %}');
    }

    Grown.Logger.getLogger().printf('\n');
  },
};
