'use strict';

const path = require('path');

module.exports = (Grown, util) => {
  const serveStatic = require('serve-static');

  function _middleware(cb) {
    return (req, res, next) => {
      let called;

      return new Promise(ok => {
        cb(req, res, err => {
          called = true;
          next(err);
        });

        process.nextTick(() => {
          if (!called) {
            res.status(200);
          }
          ok();
        });
      });
    };
  }

  return Grown('Static', {
    _middleware,

    $install(ctx) {
      const _cwd = Grown.cwd;

      util.flattenArgs(this.from_folders)
        .forEach(cwd => {
          const opts = {};

          if (typeof cwd === 'string') {
            opts.from = cwd;
          } else {
            util.extendValues(opts, cwd);
          }

          const _opts = util.extendValues({}, this.static_options, {
            fallthrough: opts.fallthrough || this.fallthrough,
            acceptRanges: opts.acceptRanges,
            cacheControl: opts.cacheControl,
            dotfiles: opts.dotfiles,
            etag: opts.etag,
            extensions: opts.extensions,
            immutable: opts.immutable,
            index: opts.index,
            lastModified: opts.lastModified,
            maxAge: opts.maxAge,
            redirect: opts.redirect,
            setHeaders: opts.setHeaders,
          });

          if (typeof opts.at === 'string' && opts.at.charAt() === '/') {
            ctx.mount(`[at:${opts.at}]`, this._middleware(serveStatic(opts.from, _opts)), opts.filter || this.filter);
          } else {
            ctx.mount(`[from:${path.relative(_cwd, opts.from) || '.'}]`, this._middleware(serveStatic(opts.from, _opts)), opts.filter || this.filter);
          }
        });
    },
  });
};
