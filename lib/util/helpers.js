'use strict';

const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const util = require('.');

function _config(file, name) {
  name = name || path.basename(path.dirname(file));

  return {
    identifier: name,
    settings: file,
    options: fs.existsSync(file)
      ? fs.readJsonSync(file)
      : {},
    update(changes) {
      this.options = util.extend({}, changes, this.options);

      fs.outputJsonSync(file, this.options, {
        spaces: 2,
      });
    },
  };
}

module.exports = ($, options) => {
  function _collect(filter, fromPath) {
    return glob.sync(filter, { cwd: options(fromPath || 'paths.config') })
      .map(srcDir =>
        _config(path.join($.cwd, options(fromPath || 'paths.config'), srcDir)));
  }

  function _contents(file, fromPath) {
    return fs.readFileSync(path.join($.cwd, options(fromPath || 'paths.public'), file));
  }

  return {
    config: _config,
    collect: _collect,
    contents: _contents,
  };
};
