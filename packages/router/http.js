'use strict';

module.exports = ($, util) => {
  function on(method, fallback) {
    return function route(path, cb) {
      if (!(typeof cb === 'function' || Array.isArray(cb))) {
        throw new Error(`Expecting a function or array, given '${JSON.stringify(cb)}'`);
      }

      if (this.router) {
        if (typeof this.router.namespace === 'function') {
          this.router[method.toLowerCase()](path, {
            pipeline: util.flattenArgs(cb),
          });
        } else {
          throw new Error(`Expecting a valid router, given '${this.router}'`);
        }
      } else {
        fallback(path, method, util.buildPipeline(path, util.flattenArgs(cb).map(util.buildMiddleware)));
      }

      return this;
    };
  }

  function add(path, method, pipeline) {
    if (!this._routes[method]) {
      this._routes[method] = {
        all: [],
        index: {},
      };
    }

    if (path.indexOf(':') === -1 && path.indexOf('*') === -1) {
      this._routes[method].index[path] = pipeline;
    } else {
      const regex = new RegExp(`^${path
        .replace(/\*[a-z]\w*/g, '(.*?)')
        .replace(/\*_\w*/g, '(?:.*?)')
        .replace(/:_\w*/g, '(?:[^/]+?)')
        .replace(/:\w+/g, '([^/]+?)')
      }$`);

      this._routes[method].all.push({
        path,
        regex,
        pipeline,
      });
    }
  }

  return $.module('Router.HTTP', {
    install(ctx) {
      if (!ctx.router) {
        this._routes = {};
      }

      util.mergeMethodsInto.call(ctx, ctx, {
        get: on('GET', add.bind(this)),
        put: on('PUT', add.bind(this)),
        post: on('POST', add.bind(this)),
        patch: on('PATCH', add.bind(this)),
        delete: on('DELETE', add.bind(this)),
      });
    },
    call(conn, options) {
      if (this._routes) {
        const map = this._routes[conn.req.method];
        const path = conn.req.url.split('?')[0];

        let pipeline = map && map.index[path];

        if (!pipeline && map) {
          for (let i = 0; i < map.all.length; i += 1) {
            const matches = path.match(map.all[i].regex);

            if (matches) {
              conn.req.params = matches.slice(1);
              pipeline = map.all[i].pipeline;
              break;
            }
          }
        }

        if (pipeline) {
          return pipeline(conn, options);
        }

        throw util.buildError(map
          ? 404
          : 403);
      }
    },
  });
};
