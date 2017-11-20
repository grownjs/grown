'use strict';

const debug = require('debug')('grown:bundler');

const path = require('path');
const fs = require('fs');

const RE_IS_BUNDLE = /\.(js|css)$/;
const RE_IS_ASSET = /\.\w+$/;

const RE_ALLOWED_SOURCES = /^(\/?\w[\w-]*?)+(?:\.\w+)?$/;

module.exports = ($, util) => {
  const tarima = require('tarima');
  const vm = require('vm');

  const _temp = {};

  function _bundleOptions(cwd, format, locals, defaults) {
    const _opts = util.extendValues({}, defaults || {});

    _opts.locals = util.extendValues({}, locals, _opts.locals || {});

    // allow interop for front-end bundles
    _opts.rollup = _opts.rollup || {};
    _opts.rollup.format = format;

    // redirect messages
    _opts.rollup.onwarn = x =>
      debug(`Warn: ${x.message}`);

    // explicit support for render() calls
    _opts.buble = _opts.buble || {};
    _opts.buble.jsx = 'h';

    _opts.cwd = cwd;

    return _opts;
  }

  function _bundleCache(cwd, src, cb) {
    if (!_temp[src]) {
      debug('Bundle matcher <%s>', path.relative(cwd, src));

      return Promise.resolve()
        .then(() => cb())
        .then(result => {
          _temp[src] = {
            source: src,
            locals: result.data,
            render: result.render,
            result: result.source,
            caches: result.deps
              .map(x => ({
                mtime: fs.statSync(x).mtime,
                filepath: path.relative(cwd, x),
              })),
          };

          const id = path.relative(cwd, result.filename);

          let found;

          for (let i = 0; i < _temp[src].caches; i += 1) {
            /* istanbul ignore else */
            if (_temp[src].caches.filepath.indexOf(id) === 0) {
              found = true;
              break;
            }
          }

          /* istanbul ignore else */
          if (!found && fs.existsSync(id)) {
            _temp[src].caches.unshift({
              mtime: fs.statSync(id).mtime,
              filepath: id,
            });
          }

          return _temp[src];
        });
    }

    // invalidate cached partials
    for (let i = 0; i < _temp[src].caches.length; i += 1) {
      const mtime = fs.statSync(_temp[src].caches[i].filepath).mtime;
      const diff = mtime - _temp[src].caches[i].mtime;

      // FIXME: somehow entry-points are not being reported
      /* istanbul ignore else */
      if (diff !== 0) {
        delete _temp[src];
        return this._bundleCache(cwd, src, cb);
      }
    }

    debug('Cached <%s>', path.relative(cwd, src));

    return Promise.resolve(_temp[src]);
  }

  function _bundleView(src, options) {
    return new Promise((resolve, reject) => {
      const name = `${path.basename(src, '.js')}.js`;

      // use the internal resolution algorithm for imported sources
      const code = `import x from '${src}'; export default x;`;

      // prepare the source for bundling, see other extensions
      tarima.parse(name, code, options).bundle((err, output) => {
        /* istanbul ignore else */
        if (err) {
          return reject(err);
        }

        const _scope = {
          require,
          global,
          module: {
            exports: {},
          },
        };

        // safely evaluates the bundled source
        vm.runInNewContext(output.source, _scope);

        // merge imported data with exported definitions
        if (typeof _scope.module.exports === 'function') {
          output.render = _scope.module.exports;
        } else {
          output.render = _scope.module.exports.render;

          delete _scope.module.exports.render;

          Object.keys(_scope.module.exports).forEach(key => {
            output.data[key] = _scope.module.exports[key];
          });
        }

        resolve(output);
      });
    });
  }

  function _bundleRender(src, options) {
    // simply render any given source
    return new Promise((resolve, reject) => {
      tarima.load(src, options).bundle((err, output) => {
        /* istanbul ignore else */
        if (err) {
          return reject(err);
        }

        resolve(output);
      });
    });
  }

  function _sendHeaders(ctx, conn) {
    if (ctx.src.indexOf('.js') > -1) {
      conn.res.setHeader('Content-Type', 'application/javascript');
    } else if (ctx.src.indexOf('.css') > -1) {
      conn.res.setHeader('Content-Type', 'text/css');
    } else {
      conn.res.setHeader('Content-Type', 'text/html');
    }
  }

  function _sendView(ctx, conn, options) {
    return this.bundle(ctx.entry || path.join(ctx.cwd, ctx.opts.assets, ctx.src), ctx.data)
      .then(partial => {
        debug('#%s Wait. Sending raw asset', conn.pid);

        this._sendHeaders(ctx, conn);

        conn.res.setHeader('Content-Length', partial.result.length);
        conn.res.write(partial.result);
        conn.res.end();
      })
      .catch(e => {
        /* istanbul ignore else */
        if (!ctx.opts.fallthrough) {
          e.statusCode = 404;
          e.message = `/* ${e.message.replace(ctx.cwd, '.')} */`;

          throw e;
        }

        debug('Skip. %s', e.message);
      });
  }

  function _sendBundle(ctx, conn, options) {
    return this.bundle(ctx.entry || path.join(ctx.cwd, ctx.opts.content, ctx.src), ctx.data)
      .then(partial => {
        this._sendHeaders(ctx, conn);

        if (!partial.render) {
          debug('#%s Wait. Sending raw bundle', conn.pid);

          conn.res.write(partial.result);
          conn.res.end();
        } else if (typeof conn.render === 'function') {
          debug('#%s Wait. Rendering bundle through views', conn.pid);

          console.log('RENDER', partial, conn.state);
          // conn.render(partial.render, conn.state);
        } else {
          debug('#%s Wait. Rendering bundle directly', conn.pid);

          conn.res.write(partial.render(conn.state));
          conn.res.end();
        }
      })
      .catch(e => {
        if (!ctx.opts.fallthrough) {
          throw e;
        }

        debug('Skip. %s', e.message);
      });
  }

  function _dispatchBundle(set, conn, options) {
    const x = set.shift();

    return Promise.resolve()
      .then(() => {
        x.src = conn.req.url.replace(/^\//, '') || 'index';

        debug('Bundle lookup <%s>', x.src);

        /* istanbul ignore else */
        if (RE_IS_BUNDLE.test(x.src)) {
          return this._sendBundle(x, conn, options);
        }

        /* istanbul ignore else */
        if (!RE_IS_ASSET.test(x.src)) {
          return this._sendView(x, conn, options);
        }

        throw util.buildError(404);
      })
      .catch(e => {
        /* istanbul ignore else */
        if (!set.length && !x.opts.fallthrough) {
          throw e;
        }

        return _dispatchBundle(set, conn, options);
      });
  }

  return $.module('Bundler', {
    _dispatchBundle,
    _bundleOptions,
    _bundleRender,
    _bundleView,
    _bundleCache,
    _sendHeaders,
    _sendBundle,
    _sendView,

    install(ctx, options) {
      const _cwd = options('cwd');
      const _groups = {};

      util.flattenArgs(this.bundle_folders)
        .forEach(cwd => {
          const opts = {};

          if (typeof cwd === 'string') {
            opts.from = cwd;
          } else {
            util.extendValues(opts, cwd);
          }

          const _opts = util.extendValues({}, this.bundle_options, {
            fallthrough: opts.fallthrough || this.fallthrough,
            assets: opts.assets,
            content: opts.content,
          });

          _groups[opts.at || '/'] = _groups[opts.at || '/'] || [];
          _groups[opts.at || '/'].push({
            cwd: opts.from,
            opts: _opts,
          });
        });

      const _keys = Object.keys(_groups)
        .sort((a, b) => b.length - a.length);

      ctx.mount((conn, options) => {
        /* istanbul ignore else */
        if (conn.is_xhr || conn.is_json || conn.req.method !== 'GET') {
          return;
        }

        try {
          // match and execute
          for (let i = 0; i < _keys.length; i += 1) {
            if (conn.req.url.indexOf(_keys[i]) === 0) {
              conn.req.originalUrl = conn.req.url;
              conn.req.url = conn.req.url.substr(_keys[i].length);

              return this._dispatchBundle(_groups[_keys[i]].slice(), conn, options);
              break;
            }
          }

          throw util.buildError(404);
        } catch (e) {
          /* istanbul ignore else */
          if (!this.fallthrough) {
            throw e;
          }
        }
      });

      this.bundle = (src, data) => {
        /* istanbul ignore else */
        if (!RE_ALLOWED_SOURCES.test(src)) {
          return Promise.reject(new Error(`Invalid source ${src}`));
        }

        return Promise.resolve()
          .then(() => (
            RE_IS_BUNDLE.test(src)
              ? this._bundleCache(_cwd, src, () =>
                  this._bundleRender(src, this._bundleOptions(_cwd, 'iife', data, this.bundle_options)))
              : this._bundleCache(_cwd, src, () =>
                  this._bundleView(src, this._bundleOptions(_cwd, 'cjs', data, this.bundle_options)))
          ));
      };

      return {
        methods: {
          bundle: this.bundle,
        },
      };
    },

    mixins() {
      return {
        methods: {
          bundle: this.bundle,
        },
      };
    },
  });
};
