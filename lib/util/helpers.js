'use strict';

const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

module.exports = ($, options) => ({
  collect: (filter, fromPath) =>
    glob.sync(filter, { cwd: options(fromPath || 'paths.config') })
      .map(srcDir => {
        const name = path.basename(path.dirname(srcDir));
        const config = path.join($.cwd, options(fromPath || 'paths.config'), srcDir);

        return {
          identifier: name,
          settings: config,
          options: fs.readJsonSync(config) || {},
          update() {
            fs.outputJsonSync(config, this.options, {
              spaces: 2,
            });
          },
        };
      }),
  contents: (file, fromPath) =>
    fs.readFileSync(path.join($.cwd, options(fromPath || 'paths.public'), file)),
});
