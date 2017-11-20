'use strict';

module.exports = ($, util) => {
  const serveStatic = require('serve-static');

  return $.module('Static', {
    install(ctx) {
      util.flattenArgs(this.static_folders)
        .forEach(cwd => {
          const opts = {};

          if (typeof cwd === 'string') {
            opts.from = cwd;
          } else {
            util.extendValues(opts, cwd);
          }

          const _opts = util.extendValues({
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
          }, this.static_options);

          if (typeof opts.at === 'string' && opts.at.charAt() === '/') {
            ctx.mount(opts.at, serveStatic(opts.from, _opts), opts.filter);
          } else {
            ctx.mount(serveStatic(opts.from, _opts), opts.filter);
          }
        });
    },
  });
};
