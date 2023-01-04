'use strict';

/* istanbul ignore file */

const path = require('path');
const fs = require('fs');

const USAGE_INFO = `

  Application server tasks

  If no hook is given it'll display server information.

  --types   Optional. Generate type definitions from defined routes
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
  configure(Grown, util) {
    Grown.CLI.define('server:exec', EXEC_TASK, () => {
      const load = util.flattenArgs(Grown.argv.flags.load).filter(Boolean);
      const run = Grown.argv._.slice(2);

      /* istanbul ignore else */
      if (!run.length) {
        throw new Error('Missing script(s)');
      }

      function locate(mod) {
        return util.load(fs.existsSync(mod) ? path.resolve(mod) : mod);
      }

      return Promise.resolve()
        .then(() => Promise.all(load.map(locate)))
        .then(exts => Promise.all(exts.map(extension => Grown.use(extension))))
        .then(() => run.reduce((prev, task) => prev.then(() => locate(task).then(fn => fn(Grown, util))), Promise.resolve()))
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
  async callback(Grown, util) {
    const applicationFile = path.resolve(Grown.cwd, process.main || Grown.argv.flags.app || 'app.js');
    const serverFactory = await util.load(applicationFile);

    const server = typeof serverFactory === 'function' ? await serverFactory() : serverFactory;
    const tasks = Grown.CLI.subtasks('server');
    const logger = Grown.Logger.getLogger();

    /* istanbul ignore else */
    if (tasks[Grown.argv._[1]]) {
      return tasks[Grown.argv._[1]].callback({ util, server });
    }

    /* istanbul ignore else */
    if (!Grown.argv.flags.types) {
      logger.printf('Server info');
    }

    const typedefs = [];
    const types = [];

    if (server.router && server.router.routes.length > 0) {
      let found;
      server.router.routes.forEach((route, i) => {
        /* istanbul ignore else */
        if (!Grown.argv.flags.types) {
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
        }

        found = true;

        const parts = route.handler.slice();
        const action = route.handler.length > 1 ? parts.pop() : 'index';
        const handler = parts.filter(x => /^[A-Z]/.test(x));
        const mod = (route.lookup || '%Controller').replace('%', handler.join('.'));
        const Ctrl = util.getProp(server.constructor, mod, new Error(`${mod} is not defined`));

        /* istanbul ignore else */
        if (typeof Ctrl[action] !== 'function') {
          throw new Error(`${mod}.${action} is not a function`);
        }

        if (Grown.argv.flags.types) {
          const suffix = `\n  /**\n  ${route.verb} ${route.path} (${mod}#${action})\n  */`;
          const params = (route.path.includes(':') && `params: RouteParams<'${route.path}'> | PathParam[]`)
            || (route.path.includes('*') && `params?: RouteParams<'${route.path}'> | PathParam[]`)
            || '';

          types.push(`R${i}`);
          typedefs.push(`type R${i} = NestedRoute<'${route.as}', RouteInfo & {${suffix}\n  url: (${params}) => string }>;\n`);
        } else {
          logger.printf('\n%s %s  {%gray. (%s: %s) %}', `   ${route.verb}`.substr(-6), route.path, route.as, `${mod}#${action}`);
        }
      });

      /* istanbul ignore else */
      if (!found) {
        logger.printf('\n  {%gray. # no matching routes %}');
      }
    } else {
      logger.printf('\n  {%gray. # without routes %}');
    }

    if (Grown.argv.flags.types) {
      const destFile = typeof Grown.argv.flags.types !== 'string'
        ? path.join(path.dirname(applicationFile), 'routes.d.ts')
        : path.resolve(Grown.argv.flags.types);

      const script = `import type { RouteMap, RouteInfo, RouteParams, NestedRoute, PathParam } from '@grown/router';
\n${typedefs.join('\n')}\nexport type Routes = ${['RouteMap'].concat(types).join(' & ')};\n`;

      Grown.CLI._.write(destFile, script);
    } else {
      logger.printf('\n');
    }
  },
};
