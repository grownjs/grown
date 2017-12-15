'use strict';

const path = require('path');

module.exports = (Grown, util) => {
  const serveStatic = require('serve-static');

  return Grown('Static', {
    install(ctx) {
      const _cwd = Grown.cwd;

      util.flattenArgs(this.static_folders)
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
            ctx.mount(`[at:${opts.at}]`, serveStatic(opts.from, _opts), opts.filter);
          } else {
            ctx.mount(`[from:${path.relative(_cwd, opts.from) || '.'}]`, serveStatic(opts.from, _opts), opts.filter);
          }
        });
    },
  });
};
