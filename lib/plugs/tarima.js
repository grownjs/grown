'use strict';

const debug = require('debug')('grown:tarima');

const path = require('path');
const fs = require('fs');

module.exports = opts => {
  const tarima = require('tarima');
  const vm = require('vm');

  opts = opts || {};

  return $ => {
    const _env = $.config('env');
    const _cwd = $.config('cwd');

    const _temp = {};
    const _options = opts.bundleOptions || {};

    const _assetsDir = path.join(_cwd, opts.assets || 'assets');
    const _contentDir = path.join(_cwd, opts.content || 'content');
    const _templatesDir = path.join(_cwd, opts.templates || 'templates');

    function makeOptions(format, locals) {
      const options = $.util.extend({}, _options);

      options.locals = $.util.extend({}, locals, options.locals || {});

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
      if (!_temp[src]) {
        debug('Fetch bundle %s', src);

        return Promise.resolve()
          .then(() => cb())
          .then(result => {
            _temp[src] = {
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

            return _temp[src];
          });
      }

      // invalidate cached partials
      for (let i = 0; i < _temp[src].caches.length; i += 1) {
        const mtime = fs.statSync(_temp[src].caches[i].filepath).mtime;
        const diff = mtime - _temp[src].caches[i].mtime;

        // FIXME: somehow entry-points are not being reported
        if (diff !== 0) {
          delete _temp[src];
          return getCache(src, cb);
        }
      }

      debug('Cached bundle %s', src);

      return Promise.resolve(_temp[src]);
    }

    function $view(src, options) {
      return new Promise((resolve, reject) => {
        debug('Bundle view %s', src);

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

    function $render(src, options) {
      // simply render any given source
      return new Promise((resolve, reject) => {
        debug('Bundle render %s', src);

        tarima.load(src, options).bundle((err, output) => {
          if (err) {
            return reject(err);
          }

          resolve(output);
        });
      });
    }

    function bundle(src, locals) {
      return Promise.resolve()
        .then(() => (
          /\.\w+$/.test(src)
            ? getCache(src, () => $render(src, makeOptions('iife', locals)))
            : getCache(src, () => $view(src, makeOptions('cjs', locals)))
        ));
    }

    // shortcuts
    $.extensions('Conn._', { bundle }, false);

    $.extensions('Conn', {
      methods: {
        bundle,
      },
    });

    // this mount-point will render pages (and assets) directly, e.g
    // `/example` (address bar) => `pages/example.js` (file explorer)
    $.mount('tarima', conn => {
      // take the page-identifier from the requested page
      let src = conn.request_path.replace(/^\//, '') || 'index';

      debug('Bundle lookup %s', src);

      // adjust prefix
      if (opts.prefix) {
        if (src.indexOf(opts.prefix) !== 0) {
          debug('Prefix unmatch %s', opts.prefix);
          return;
        }

        src = src.substr(opts.prefix.length + 1);
      }

      const isAsset = /\.(js|css)$/.test(src);
      const isBundle = !/\.\w+$/.test(src);

      // apply filtering
      let _opts = (typeof opts.callback === 'function'
        ? opts.callback(conn, src)
        : {});

      if (typeof _opts === 'string') {
        _opts = {
          entry: _opts,
        };
      }

      if (!_opts) {
        debug('Skip. Bundle disabled');
        return;
      }


      const assetsDir = _opts.assetsDir || _assetsDir;
      const contentDir = _opts.contentDir || _contentDir;
      const templatesDir = _opts.templatesDir || _templatesDir;
      const isFallthrough = _opts.fallthrough || opts.fallthrough;

      // for other assets, just render as-is
      if (isAsset) {
        conn.put_resp_content_type(src.indexOf('.css') === 0 ? 'application/javascript' : 'text/css');

        return conn.bundle(_opts.entry || `${assetsDir}/${_opts.src || src}`, _opts.locals)
          .then(partial => {
            conn.put_resp_header('Content-Length', partial.result.length);
            conn.resp_body = partial.result;
            conn.layout = false;
            conn.end();
          })
          .catch(e => {
            if (!isFallthrough) {
              conn.resp_body = `/* ${e.message} */`;
              conn.layout = false;
              conn.end(404);
            }
          });
      }

      // skip extensions
      if (isBundle) {
        return conn.bundle(_opts.entry || `${contentDir}/${_opts.src || src}`, _opts.locals)
          .then(partial => {
            conn.put_resp_content_type('text/html');

            // set the page/title to be rendered
            conn.set_state('title', partial.locals.title);
            conn.set_state('environment', _env);

            if (typeof conn.view === 'function' && partial.locals.layout) {
              conn.view(partial.render, { as: 'yield' });

              // assign the final layout
              return conn.bundle(`${templatesDir}/${partial.locals.layout}`)
                .then(layout => {
                  conn.layout = layout.render;
                  conn.end();
                });
            }

            conn.resp_body = partial.render($.util.extend({}, conn.state, _opts.locals));
            conn.layout = partial.locals.layout;
            conn.end();
          })
          .catch(e => {
            if (!isFallthrough) {
              conn.put_resp_content_type('text/plain');
              conn.resp_body = e.message;
              conn.layout = false;
              conn.end(404);
            }
          });
      }
    });
  };
};
