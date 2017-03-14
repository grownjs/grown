'use strict';

/* eslint-disable global-require */

const _ = require('../lib/util');

const path = require('path');
const chalk = require('chalk');

const CLR = '\x1b[K';

module.exports = $ => {
  const IS_DEBUG = $.flags.debug === true;

  let name = $._.shift();
  let cwd = process.cwd();

  /* istanbul ignore else */
  if (!name) {
    throw new Error("Missing APP_PATH, it's required!");
  }

  if (name === '.') {
    name = path.basename(cwd);
  } else {
    name = (name || '').replace(/\W+/g, '-');
    cwd = path.join(cwd, name);
  }

  function done(err) {
    _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\n');
    _.die(1);
  }

  const Haki = require('haki');

  const haki = new Haki(cwd, $.flags);

  haki.runGenerator({
    abortOnFail: true,
    basePath: path.join(__dirname, '../skel/template'),
    actions: [{
      copy: '.',
      src: '.',
    }, {
      render: ['package.json', 'app/config/database.js'],
    }, {
      type: 'install',
      dependencies: ['grown', 'csurf', 'morgan', 'body-parser', 'serve-static'],
      optionalDependencies: ['eslint', 'eslint-plugin-import', 'eslint-config-airbnb-base'],
    }],
  }, {
    APP_NAME: name,
  })
  .catch(done)
  .then(() => {
    _.echo(chalk.green('Done.'), CLR, '\n');
  });
};
