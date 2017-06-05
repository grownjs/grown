'use strict';

const debug = require('debug')('grown:access');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

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
      Array.prototype.push.apply(out, getTree(c, groups, property));
      out.push(c);
    });
  }

  return property !== 'children'
    ? out.reverse()
    : out;
}

function validateRules(conn, role, handlers, defaults) {
  const children = getTree(role, defaults.roles, 'children');
  const parents = getTree(role, defaults.roles, 'parents');

  debug('#%s Checking access for %s <%s>', conn.pid, role, handlers.join(', '));

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
          if (cur[1] === null) {
            cur[0] = prev[0];
            cur[1] = prev[1];

            debug('#%s Inherited access <%s> %s', conn.pid, cur[0], prev[1]);
          }

          return cur;
        }, ['Unknown', false]);
    })
    .then(result => {
      if (!result) {
        debug('#%s Invalid access', conn.pid);
      } else {
        debug('#%s Got access <%s> %s', conn.pid, result[0], result[1]);
      }

      if (result && result[1] === false) {
        return conn.raise(403);
      }
    });
}

module.exports = args => {
  return $ => {
    const logger = $.logger.getLogger();

    const _defaults = {};
    const _ruleset = [];
    const _groups = {};

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

      _defaults.resources = _defaults.resources || {};
      _defaults.permissions = _defaults.permissions || {};

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
              _defaults.permissions[resourceName] = rules[key];
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

          return validateRules(this, role, _handlers, _defaults);
        },
      },
    });

    $.on('listen', () => {
      /* istanbul ignore else */
      if ($.extensions.routes) {
        $.extensions.routes.forEach(x => {
          _ruleset.push({
            path: x.route.path.replace(/:\w+/g, '*'),
            method: x.route.verb.toUpperCase(),
            handler: !x.route._actionName
              ? x.route.handler.join('.')
              : [x.route._resourceName, x.route._actionName].join('.'),
          });
        });
      }

      const matchHandlers = makeMatcher(_ruleset);

      $.mount('access', conn => {
        const map = matchHandlers(conn)
          .filter(x => x);

        const role = conn.access || 'Unknown';

        return validateRules(conn, role, map, _defaults);
      });
    });

    $.on('repl', repl => {
      repl.defineCommand('access', {
        help: 'Display resources ACL',
        action(value) {
          console.log(_defaults);
          repl.displayPrompt();
        },
      });
    });
  };
};
