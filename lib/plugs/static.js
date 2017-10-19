'use strict';

const path = require('path');

module.exports = args => {
  const _folders = [];

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      _folders.push(path.relative(process.cwd(), cwd));
    });
  });

  return $ => {
    const serveStatic = require('serve-static');

    _folders.forEach(dir => {
      $.mount(serveStatic(dir));
    });
  };
};
