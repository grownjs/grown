'use strict';

const debug = require('debug')('grown:access');

const RE_DOUBLE_STAR = /\/\*\*/g;
const RE_SINGLE_STAR = /\/\*/g;

module.exports = (Grown, util) => {
  function _reduceHandler(handler, permissions) {
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
      return null;
    }

    return _handler;
  }

  function _compileMatch(rule) {
    const fixedRoute = rule.path
      .replace(RE_DOUBLE_STAR, '/.*?')
      .replace(RE_SINGLE_STAR, '/[^\\/]+?');

    let regex;

    try {
      regex = new RegExp(`^${fixedRoute}$`);
    } catch (e) {
      throw new Error(`Cannot compile '${rule.path}' as route handler`);
    }

    return conn => {
      /* istanbul ignore else */
      if (rule.method
        && rule.method !== conn.req.method) {
        return;
      }

      return regex.test(conn.req.url) && rule.handler;
    };
  }

  function _makeMatcher(ruleset) {
    const matches = ruleset.map(rule => this._compileMatch(rule));

    debug('%s handler%s %s compiled',
      ruleset.length,
      ruleset.length === 1 ? '' : 's',
      ruleset.length === 1 ? 'was' : 'were');

    return conn =>
      matches
        .map(match => match(conn))
        .filter(x => x);
  }

  function _makeTree(role, groups, property) {
    const out = [];

    /* istanbul ignore else */
    if (groups[role]) {
      groups[role][property].forEach(c => {
        out.push(c);
        Array.prototype.push.apply(out, this._makeTree(c, groups, property));
      });
    }

    return out;
  }

  function _runACL(conn, role, handlers) {
    const children = this._makeTree(role, this._groups, 'children');
    const parents = this._makeTree(role, this._groups, 'parents');

    debug('#%s Checking access for %s <%s>', conn.pid, role, handlers.join(', ') || '...');

    return Promise.resolve()
      .then(() => {
        const c = handlers.length;
        const ok = [];

        for (let i = 0; i < c; i += 1) {
          const handler = handlers[i];

          // FIXME: normalize possible values
          let test = this._reduceHandler(handler, this.permissions);

          /* istanbul ignore else */
          if (test !== null && typeof test === 'object' && typeof test[role] !== 'undefined') {
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

          /* istanbul ignore else */
          if (test !== null) {
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
              if (test && typeof test[children[l]] !== 'undefined') {
                ok.push([children[l], test[children[l]]]);
                break;
              }
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
          }, false);
      })
      .then(result => {
        /* istanbul ignore else */
        if (result === false || result[1] === false) {
          return conn.raise(403);
        }

        if (!result) {
          debug('#%s Skip. No rules were defined', conn.pid);
        } else {
          debug('#%s Got access <%s> %s', conn.pid, result[0], result[1]);
        }
      });
  }

  return Grown('Access', {
    _reduceHandler,
    _compileMatch,
    _makeMatcher,
    _makeTree,
    _runACL,

    _groups: {},
    _ruleset: [],

    resources: {},
    permissions: {},

    $install(ctx) {
      /* istanbul ignore else */
      if (typeof this.access_rules === 'object') {
        this.rules(this.access_rules);
      }

      const matchHandlers = this._makeMatcher(this._ruleset);

      ctx.mount('Access#pipe', conn => {
        const _handlers = matchHandlers(conn).filter(x => x);

        return Promise.resolve()
          .then(() => (this.access_filter && this.access_filter(conn)) || 'Unknown')
          .then(x => this._runACL(conn, x, _handlers));
      });
    },

    $mixins() {
      const self = this;

      return {
        methods: {
          can(role, resource, action) {
            const _handlers = !Array.isArray(resource)
              ? [action ? `${resource}.${action}` : resource]
              : resource;

            return Promise.resolve()
              .then(() => role || (self.access_filter && self.access_filter(this)) || 'Unknown')
              .then(x => self._runACL(this, x, _handlers));
          },
        },
      };
    },

    rules(config) {
      util.extendValues(this.permissions, config.permissions);

      Object.keys(config.resources || {}).forEach(key => {
        this.resources[key] = util.flattenArgs(config.resources[key]);
        this.resources[key].forEach(_path => {
          let _method = 'GET';

          /* istanbul ignore else */
          if (_path.indexOf(' ') > -1) {
            _path = _path.split(' ');
            _method = _path[0].toUpperCase();
            _path = _path[1];
          }

          this._ruleset.push({
            path: _path,
            method: _method,
            handler: key,
          });
        });
      });

      (!Array.isArray(config.roles) && config.roles ? [config.roles] : config.roles || [])
        .forEach(roles => roles.split('.').reduce((prev, cur) => {
          /* istanbul ignore else */
          if (!prev) {
            return cur;
          }

          /* istanbul ignore else */
          if (!this._groups[prev]) {
            this._groups[prev] = {
              parents: [],
              children: [],
            };
          }

          /* istanbul ignore else */
          if (!this._groups[cur]) {
            this._groups[cur] = {
              parents: [],
              children: [],
            };
          }

          this._groups[prev].parents.push(cur);
          this._groups[cur].children.push(prev);

          return cur;
        }, null));

      return this;
    },
  });
};
