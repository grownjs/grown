'use strict';

const debug = require('debug')('grown:tarima-render');

const path = require('path');

const RE_IS_BUNDLE = /\.(js|css)$/;
const RE_IS_ASSET = /\.\w+$/;

module.exports = ($, util) => {
  function _sendHeaders(ctx, conn) {
    conn.halted = true;

    /* istanbul ignore else */
    if (conn.res) {
      if (ctx.src.indexOf('.js') > -1) {
        conn.res.setHeader('Content-Type', 'application/javascript');
      } else if (ctx.src.indexOf('.css') > -1) {
        conn.res.setHeader('Content-Type', 'text/css');
      } else {
        conn.res.setHeader('Content-Type', 'text/html');
      }
    }
  }

  function _sendView(ctx, conn, options) {
    return this.bundle(ctx.entry || path.join(ctx.cwd, ctx.opts.assets, ctx.src), ctx.data)
      .then(partial => {
        this._sendHeaders(ctx, conn);

        if (!partial.render) {
          debug('#%s Wait. Sending raw asset', conn.pid);

          if (typeof conn.end === 'function') {
            return conn.end(partial.result);
          } else {
            conn.res.write(partial.result);
            conn.res.end();
          }
        } else if (typeof conn.render === 'function' && typeof partial.render === 'function') {
          debug('#%s Wait. Rendering asset through views', conn.pid);

          return conn.render(partial.render, conn.state);
        } else if (conn.res) {
          debug('#%s Wait. Sending raw asset', conn.pid);

          conn.res.setHeader('Content-Length', partial.result.length);
          conn.res.write(partial.result);
          conn.res.end();
        }
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

        debug('#%s Wait. Rendering bundle', conn.pid);

        /* istanbul ignore else */
        if (conn.res) {
          conn.res.write(typeof partial.render === 'function'
            ? partial.render(conn.state)
            : partial.result);
          conn.res.end();
        }
      })
      .catch(e => {
        /* istanbul ignore else */
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

  return $.module('Tarima.Render', {
    _dispatchBundle,
    _sendHeaders,
    _sendBundle,
    _sendView,

    install(ctx) {
      if (!this._bundleRender) {
        throw new Error('Tarima.Render depends on Tarima.Bundler, please include within');
      }

      const _groups = {};

      util.flattenArgs(this.src_folders)
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

      ctx.mount('Tarima#pipe', (conn, options) => {
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
    },
  });
};