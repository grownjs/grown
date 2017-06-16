'use strict';

const debug = require('debug')('grown:static');

const path = require('path');

module.exports = args => {
  const _folders = [];

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      _folders.push(path.relative(process.cwd(), cwd));
    });
  });

  return $ => {
    $.on('listen', () => {
      const serveStatic = require('serve-static');

      _folders.forEach(dir => {
        $.mount(serveStatic(dir));
      });
    });
  };
};
