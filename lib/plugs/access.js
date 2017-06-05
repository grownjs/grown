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

    if (_handler) {
      break;
    }

    parts.pop();
  }

  if (!_handler) {
    throw new Error(`Missing rules for '${handler}' resource`);
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

  return (verb, input) => {
    if (rule.method
      && rule.method !== verb) {
      return;
    }

    return regex.test(input) && rule.handler;
  };
}

function makeMatcher(ruleset) {
  const matches = ruleset.map(rule => compileMatch(rule));

  return (verb, route) =>
    matches
      .map(match => match(verb, route))
      .filter(x => x);
}

function getTree(role, groups, property) {
  const out = [];

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

  return Promise.resolve()
    .then(() => {
      const c = handlers.length;
      const ok = [];

      for (let i = 0; i < c; i += 1) {
        const handler = handlers[i];

        // FIXME: normalize possible values
        let test = reduceHandler(handler, defaults.permissions);

        if (typeof test === 'object' && test[role]) {
          test = test[role];
        }

        if (typeof test === 'boolean') {
          ok.push([handler, test ? true : false]);
          test = {};
        }

        if (typeof test === 'string') {
          ok.push([handler, test]);
          test = {};
        }

        if (typeof test === 'function') {
          ok.push([handler, test]);
          test = {};
        }

        const x = children.length;

        for (let j = 0; j < x; j += 1) {
          if (test[children[j]]) {
            ok.push([children[j], test[children[j]]]);
            break;
          }
        }

        const y = parents.length;

        for (let k = 0; k < y; k += 1) {
          if (test[parents[k]]) {
            ok.push([parents[k], test[parents[k]]]);
            break;
          }
        }
      }

      // FIXME: allow promises and serial callbacks?
      return ok
        .map(check => {
          if (typeof check[1] === 'function') {
            return [check[0], check[1](conn)];
          }

          if (check[1] === 'allow') {
            return [check[0], true];
          }

          if (check[1] === 'deny') {
            return [check[0], false];
          }

          return check;
        })
        .reduce((prev, cur) => {
          if (!prev || prev[1] === true) {
            if (parents.indexOf(cur[0]) > -1) {
              return cur[1] !== true
                ? [cur[0], true]
                : [cur[0], false];
            }
            return cur;
          }
          return prev;
        }, null);
    })
    .then(result => (result && !result[1] && conn.raise(403)));
}

module.exports = args => {
  return $ => {
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

      (!Array.isArray(defaults.roles) ? [defaults.roles] : defaults.roles)
        .forEach(roles => roles.split('.').reduce((prev, cur) => {
          if (!prev) {
            return cur;
          }

          if (!_groups[prev]) {
            _groups[prev] = {
              parents: [],
              children: [],
            };
          }

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

      // set role-groups
      _defaults.roles = _groups;

      ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
        debug('Loading resources from %s', path.relative(process.cwd(), cwd));

        glob.sync('**/*.js', { cwd, nodir: true }).forEach(src => {
          const resourceName = src
            .replace(/\/index\.js$/, '')
            .replace(/\.js$/, '');

          _defaults.permissions[resourceName.replace(/\//g, '.')] = require(path.join(cwd, src));
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

    $.on('start', () => {
      if ($.extensions.routes) {
        $.extensions.routes.forEach(x => {
          _ruleset.push({
            path: x.route.path.replace(/:\w+/g, '*'),
            method: x.route.verb.toUpperCase(),
            handler: x.route.handler.join('.'),
          });
        });
      }
    });

    $.on('listen', () => {
      const matchHandlers = makeMatcher(_ruleset)

      $.mount(conn => {
        const handlers = matchHandlers(conn.method, conn.request_path)
          .filter(x => x);

        return validateRules(conn, conn.access || conn.role, handlers, _defaults);
      });
    });

    debug('OSOM');
  };
};
