'use strict';

const debug = require('debug')('grown:tarima:bundler');

const path = require('path');
const fs = require('fs');

const RE_BUNDLE_EXTENSIONS = /\.(js|css)$/;
const RE_ALLOWED_SOURCES = /^(\/?\w[\w-]*?)+(?:\.\w+)?$/;

module.exports = (Grown, util) => {
  const tarima = require('tarima');

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
        util.invoke(output.source, _scope);

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

  return Grown('Tarima.Bundler', {
    _bundleOptions,
    _bundleRender,
    _bundleCache,
    _bundleView,

    $install() {
      const _cwd = Grown.cwd;

      this.bundle = (src, data) => {
        /* istanbul ignore else */
        if (!RE_ALLOWED_SOURCES.test(src)) {
          return Promise.reject(new Error(`Invalid source ${src}`));
        }

        return Promise.resolve()
          .then(() => (
            RE_BUNDLE_EXTENSIONS.test(src)
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

    $mixins() {
      return {
        methods: {
          bundle: this.bundle,
        },
      };
    },
  });
};
