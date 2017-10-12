'use strict';

const path = require('path');

module.exports = opts => {
  return $ => {
    const tarima = require('tarima');
    const fs = require('fs');
    const vm = require('vm');

    const _cwd = $.config('cwd');
    const _cache = {};

    opts = opts || {};

    function makeOptions(format) {
      const options = {};

      Object.keys(opts).forEach(key => {
        options[key] = opts[key];
      });

      // allow interop for front-end bundles
      options.rollup = options.rollup || {};
      options.rollup.format = format;

      // explicit support for render() calls
      options.buble = options.buble || {};
      options.buble.jsx = 'h';

      options.cwd = _cwd;

      return options;
    }

    function getCache(src, cb) {
      if (!_cache[src]) {
        return Promise.resolve()
          .then(() => cb())
          .then(result => {
            _cache[src] = {
              locals: result.data,
              render: result.render,
              result: result.source,
              caches: result.deps
                .concat(!result.deps.length
                  ? [src]
                  : [])
                .map(x => ({
                  filepath: x,
                  mtime: fs.statSync(x).mtime,
                })),
            };

            return _cache[src];
          });
      }

      // invalidate cached partials
      for (let i = 0; i < _cache[src].caches.length; i += 1) {
        const mtime = fs.statSync(_cache[src].caches[i].filepath).mtime;
        const diff = mtime - _cache[src].caches[i].mtime;

        // FIXME: somehow entry-points are not being reported
        if (diff !== 0) {
          delete _cache[src];
          return getCache(src, cb);
        }
      }

      return Promise.resolve(_cache[src]);
    }

    function view(src, options) {
      return new Promise((resolve, reject) => {
        const name = `${path.basename(src, '.js')}.js`;

        // use the internal resolution algorithm for imported sources
        const code = `import x from '${src}'; export default x;`;

        // prepare the source for bundling, see other extensions
        tarima.parse(name, code, options).bundle((err, output) => {
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

    function render(src, options) {
      // simply render any given source
      return new Promise((resolve, reject) => {
        tarima.load(src, options).bundle((err, output) => {
          if (err) {
            return reject(err);
          }

          resolve(output);
        });
      });
    }

    function _bundler(src) {
      return Promise.resolve()
        .then(() => (
          /\.\w+$/.test(src)
            ? getCache(src, () => render(src, makeOptions('iife')))
            : getCache(src, () => view(src, makeOptions('cjs')))
        ));
    }

    // expose as static methods
    $.extensions('Conn._').bundle = _bundler;

    // expose as connection methods
    $.extensions('Conn', {
      methods: {
        bundle: _bundler,
      },
    });
  };
};
