'use strict';

/* eslint-disable global-require */

module.exports = ($, cwd) => {
  // const IS_DEBUG = $.flags.debug === true;

  const _ = require('../lib/util');

  const _cmd = $._.shift();

  const Haki = require('haki');
  // const chalk = require('chalk');

  const haki = new Haki(cwd, _.extend({}, $.flags, { data: $._ }));

  haki.load(require.resolve('../skel/generate'));

  function _onError(err) {
    // _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\r\n');
    _.die(1);
  }

  function _run() {
    /* istanbul ignore else */
    if (!$.flags.list && _cmd) {
      return haki.runGenerator(_cmd, _.extend({}, $.data, $.params));
    }

    /* istanbul ignore else */
    if ($.flags.list) {
      return Promise.resolve(haki.getGeneratorList().forEach(task => {
        // _.echo(chalk.gray('—'), ' ',
          // chalk.cyan(task.result.description || task.name), '\r\n');

        // _.echo('  ',
          // chalk.gray(`grown g ${task.generate}`),
          // task.result.arguments ? chalk.gray(` [${task.result.arguments.join('] [')}]`) : '',
          // '\r\n');
      }));
    }

    return haki.chooseGeneratorList(_.extend({}, $.data, $.params));
  }

  _run().catch(_onError);
};
