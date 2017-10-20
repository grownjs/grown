'use strict';

const path = require('path');

module.exports = opts => {
  opts = opts || {};

  const _folders = [];

  ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
    _folders.push(path.relative(process.cwd(), cwd));
  });

  return $ => {
    const serveStatic = require('serve-static');

    _folders.forEach(cwd => {
      $.mount(serveStatic(cwd), conn => {
        /* istanbul ignore else */
        if (typeof opts.callback === 'function') {
          return opts.callback(conn, cwd);
        }
      });
    });
  };
};
