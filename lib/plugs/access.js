'use strict';

const debug = require('debug')('grown:access');

const wargs = require('wargs');
const glob = require('glob');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const reInterpolate = /`([^`]+)`/g;
const reDoubleStar = /\/\*\*/g;
const reSingleStar = /\/\*/g;

function reduceHandler(handler, permissions) {
  const parts = handler.split('.');

  let _handler;

  // iterate until one handler matches
  while (parts.length) {
    _handler = permissions[parts.join('.')];

    /* istanbul ignore else */
    if (_handler) {
      break;
    }

    parts.pop();
  }

  /* istanbul ignore else */
  if (!_handler) {
    return 'inherit';
  }

  return _handler;
}

function compileMatch(rule) {
  const fixedRoute = rule.path
    .replace(reDoubleStar, '/.*?')
    .replace(reSingleStar, '/[^\\/]+?');

  let regex;

  try {
    regex = new RegExp(`^${fixedRoute}$`);
  } catch (e) {
    throw new Error(`Cannot compile '${rule.path}' as route handler`);
  }

  return conn => {
    /* istanbul ignore else */
    if (rule.method
      && rule.method !== conn.method) {
      return;
    }

    return regex.test(conn.request_path) && rule.handler;
  };
}

function makeMatcher(ruleset) {
  const matches = ruleset.map(rule => compileMatch(rule));

  debug('%s handler%s %s compiled',
    ruleset.length,
    ruleset.length === 1 ? '' : 's',
    ruleset.length === 1 ? 'was' : 'were');

  return conn =>
    matches
      .map(match => match(conn))
      .filter(x => x);
}

function getTree(role, groups, property) {
  const out = [];

  /* istanbul ignore else */
  if (groups[role]) {
    groups[role][property].forEach(c => {
      out.push(c);
      Array.prototype.push.apply(out, getTree(c, groups, property));
    });
  }

  return out;
}

function validateRules(conn, role, handlers, defaults) {
  const children = getTree(role, defaults.roles, 'children');
  const parents = getTree(role, defaults.roles, 'parents');

  debug('#%s Checking access for %s <%s>', conn.pid, role, handlers.join(', ') || '?');

  return Promise.resolve()
    .then(() => {
      const c = handlers.length;
      const ok = [];

      for (let i = 0; i < c; i += 1) {
        const handler = handlers[i];

        // FIXME: normalize possible values
        let test = reduceHandler(handler, defaults.permissions);

        /* istanbul ignore else */
        if (typeof test === 'object' && typeof test[role] !== 'undefined') {
          test = test[role];
        }

        /* istanbul ignore else */
        if (typeof test === 'boolean') {
          ok.push([handler, test]);
          test = {};
        }

        /* istanbul ignore else */
        if (typeof test === 'string') {
          ok.push([handler, test]);
          test = {};
        }

        /* istanbul ignore else */
        if (typeof test === 'function') {
          ok.push([handler, test]);
          test = {};
        }

        const y = parents.length;

        for (let k = 0; k < y; k += 1) {
          /* istanbul ignore else */
          if (typeof test[parents[k]] !== 'undefined') {
            ok.push([parents[k], test[parents[k]]]);
            break;
          }
        }

        const z = children.length;

        for (let l = 0; l < z; l += 1) {
          /* istanbul ignore else */
          if (typeof test[children[l]] !== 'undefined') {
            ok.push([children[l], test[children[l]]]);
            break;
          }
        }
      }

      // FIXME: allow promises and serial callbacks?
      return ok
        .map(check => {
          /* istanbul ignore else */
          if (typeof check[1] === 'function') {
            check[1] = check[1](conn);
          }

          /* istanbul ignore else */
          if (check[1] === 'inherit') {
            check[1] = null;
          }

          /* istanbul ignore else */
          if (check[1] === 'allow') {
            check[1] = true;
          }

          /* istanbul ignore else */
          if (check[1] === 'deny') {
            check[1] = false;
          }

          debug('#%s Test access <%s> %s', conn.pid, check[0], check[1]);

          return check;
        })
        .reduce((prev, cur) => {
          /* istanbul ignore else */
          if (parents.indexOf(cur[0]) > -1) {
            debug('#%s Parent access found <%s>', conn.pid, cur[0]);
            cur[1] = false;
          }

          /* istanbul ignore else */
          if (children.indexOf(cur[0]) > -1) {
            debug('#%s Children access found <%s>', conn.pid, cur[0]);
            cur[1] = true;
          }

          /* istanbul ignore else */
          if (prev && cur[1] === null) {
            cur[0] = prev[0];
            cur[1] = prev[1];

            debug('#%s Inherited access <%s> %s', conn.pid, cur[0], prev[1]);
          }

          return cur;
        }, null);
    })
    .then(result => {
      if (!result) {
        debug('#%s Skip. No rules were defined', conn.pid);
      } else {
        debug('#%s Got access <%s> %s', conn.pid, result[0], result[1]);
      }

      /* istanbul ignore else */
      if (result && result[1] === false) {
        return conn.raise(403);
      }
    });
}

module.exports = args => {
  return $ => {
    const logger = $.logger.getLogger();

    // expose compiled data staticly
    const _defaults = $.extensions.access = {};

    const _ruleset = [];
    const _groups = {};

    // repl-session
    let _role;

    ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
      /* istanbul ignore else */
      if (typeof opts.settings !== 'string' || !fs.existsSync(opts.settings)) {
        throw new Error(`Expecting 'opts.settings' to be a valid file, given '${opts.settings}'`);
      }

      debug('Loading policies from %s', path.relative(process.cwd(), opts.settings));

      const defaults = require(opts.settings);

      Object.keys(defaults).forEach(key => {
        _defaults[key] = defaults[key];
      });

      _defaults.callback = _defaults.callback || opts.callback;
      _defaults.resources = _defaults.resources || opts.resources || {};
      _defaults.permissions = _defaults.permissions || opts.permissions || {};

      /* istanbul ignore else */
      if (_defaults.callback && typeof _defaults.callback !== 'function') {
        throw new Error(`Expecting 'opts.callback' to be a function, given '${opts.callback}'`);
      }

      Object.keys(_defaults.resources).forEach(key => {
        let _path = _defaults.resources[key];
        let _method = 'GET';

        /* istanbul ignore else */
        if (_path.indexOf(' ') > -1) {
          _path = _path.split(' ');
          _method = _path[0].toUpperCase();
          _path = _path[1];
        }

        _ruleset.push({
          path: _path,
          method: _method,
          handler: key,
        });
      });

      (!Array.isArray(defaults.roles) && defaults.roles ? [defaults.roles] : defaults.roles || [])
        .forEach(roles => roles.split('.').reduce((prev, cur) => {
          /* istanbul ignore else */
          if (!prev) {
            return cur;
          }

          /* istanbul ignore else */
          if (!_groups[prev]) {
            _groups[prev] = {
              parents: [],
              children: [],
            };
          }

          /* istanbul ignore else */
          if (!_groups[cur]) {
            _groups[cur] = {
              parents: [],
              children: [],
            };
          }

          _groups[prev].parents.push(cur);
          _groups[cur].children.push(prev);

          return cur;
        }, null));

      // set groups
      _defaults.roles = _groups;

      ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
        debug('Loading resources from %s', path.relative(process.cwd(), cwd));

        glob.sync('**/*.js', { cwd, nodir: true }).forEach(src => {
          const resourceName = src
            .replace(/\/index\.js$/, '')
            .replace(/\.js$/, '')
            .replace(/\//g, '.');

          const rules = require(path.join(cwd, src));

          Object.keys(rules).forEach(key => {
            /* istanbul ignore else */
            if (typeof rules[key] === 'undefined' || rules[key] === null) {
              throw new Error(`Invalid value for '${resourceName}.${key}', given '${rules[key]}'`);
            }

            /* istanbul ignore else */
            if (!_defaults.permissions[resourceName]) {
              _defaults.permissions[resourceName] = {};
            }

            /* istanbul ignore else */
            if (typeof rules[key] === 'string'
              || typeof rules[key] === 'boolean'
              || typeof rules[key] === 'function') {
              _defaults.permissions[resourceName][key] = rules[key];
              return;
            }

            /* istanbul ignore else */
            if (Array.isArray(rules[key])) {
              /* istanbul ignore else */
              if (!Array.isArray(rules[key][0])) {
                rules[key] = [rules[key]];
              }

              rules[key].forEach(keys => {
                const _keys = keys.slice();
                const _check = _keys.pop();

                _keys.forEach(prop => {
                  /* istanbul ignore else */
                  if (!_defaults.permissions[`${resourceName}.${prop}`]) {
                    _defaults.permissions[`${resourceName}.${prop}`] = {};
                  }

                  _defaults.permissions[`${resourceName}.${prop}`][key] = _check;
                });
              });
              return;
            }

            Object.keys(rules[key]).forEach(sub => {
              /* istanbul ignore else */
              if (!_defaults.permissions[`${resourceName}.${sub}`]) {
                _defaults.permissions[`${resourceName}.${sub}`] = {};
              }

              _defaults.permissions[`${resourceName}.${sub}`][key] = rules[key][sub];
            });
          });
        });
      });
    });

    $.extensions('Conn', {
      methods: {
        can(role, resource, action) {
          const _handlers = !Array.isArray(resource)
            ? [action ? `${resource}.${action}` : resource]
            : resource;

          return Promise.resolve()
            .then(() => role || (_defaults.callback && _defaults.callback(this)) || 'Unknown')
            .then(x => validateRules(this, x, _handlers, _defaults));
        },
      },
    });

    $.on('listen', () => {
      const matchHandlers = makeMatcher(_ruleset);

      $.mount('access', conn => {
        const _handlers = matchHandlers(conn).filter(x => x);

        return Promise.resolve()
          .then(() => _role || (_defaults.callback && _defaults.callback(conn)) || 'Unknown')
          .then(x => validateRules(conn, x, _handlers, _defaults));
      });
    });

    $.on('repl', repl => {
      repl.defineCommand('access', {
        help: 'Display and set ACL for resources',
        action(value) {
          const _args = wargs(value, v => {
            // allow dynamic value interpolation
            try {
              return v.replace(reInterpolate, ($0, $1) => vm.runInNewContext($1, repl.context));
            } catch (e) {
              throw new Error(`Invalid expression within '${v}'. ${e.message}`);
            }
          });

          /* istanbul ignore else */
          if (typeof _args.flags.role === 'string') {
            logger.info('{% ok Set %s role %}\n', _args.flags.role);
            _role = _args.flags.role;
          }

          /* istanbul ignore else */
          if (_args.flags.role === false) {
            logger.info('{% ok Unset previous role %}\n');
            _role = null;
          }

          Object.keys(_args.data).forEach(key => {
            logger.info('{% ok Set %s permission %}\n', key);
            _defaults.permissions[key] = _args.data[key];
          });

          logger.info('{% item Ruleset: %}\n');

          _ruleset.forEach(map => {
            logger.info('  {% 8.pad.green %s %} {% gray %s %} {% cyan %s %}\n', map.method, map.path, map.handler);
          });

          logger.info('{% item All roles: %} %s\n', Object.keys(_defaults.roles)
            .map(role => (_role === role ? `{% tip ${role} %}` : role))
            .join(', '));

          logger.info('{% item Resources: %}\n');

          Object.keys(_defaults.resources).forEach(key => {
            logger.info('  {% cyan %s %} {% gray %s %}\n', key, _defaults.resources[key]);
          });

          logger.info('{% item Permissions: %}\n');

          Object.keys(_defaults.permissions).forEach(key => {
            logger.info('  {% cyan %s %} {% gray %s %}\n', key, _defaults.permissions[key]);
          });

          repl.displayPrompt();
        },
      });
    });
  };
};
