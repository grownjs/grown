'use strict';

/* eslint-disable global-require */

module.exports = $ => {
  const IS_DEBUG = $.flags.debug === true;

  // let the user define the cwd outside
  $.flags.cwd = $.flags.cwd || process.cwd();

  const _ = require('../lib/util');

  const _cmd = $._.shift();

  const Haki = require('haki');
  const chalk = require('chalk');

  const haki = new Haki(_.merge({}, $.flags, { data: $._ }));

  haki.load(require.resolve('../skel/generate'));

  function _onError(err) {
    _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\n');
    _.die(1);
  }

  function _run() {
    if (!$.flags.list && _cmd) {
      return haki.runGenerator(_cmd, _.merge({}, $.data, $.params));
    }

    return haki.chooseGeneratorList(_.merge({}, $.data, $.params));
  }

  _run().catch(_onError);
};
