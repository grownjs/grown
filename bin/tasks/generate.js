'use strict';

/* eslint-disable global-require */

module.exports = ($, cwd, logger) => {
  const _ = require('../lib/util');

  const _cmd = $._.shift();

  const Haki = require('haki');

  const haki = new Haki(cwd, _.extend({}, $.flags, { data: $._ }));

  haki.load(require.resolve('../skel/generate'));

  function _run() {
    /* istanbul ignore else */
    if (!$.flags.list && _cmd) {
      return haki.runGenerator(_cmd, _.extend({}, $.data, $.params));
    }

    /* istanbul ignore else */
    if ($.flags.list) {
      return haki.getGeneratorList().forEach(task => {
        logger.info('\r{% item %s %}\r\n', task.value.description || task.name);
        logger.info('  {% bold g %s %}%s\n', task.gen, task.value.arguments
          ? ` {% gray [${task.value.arguments.join('] [')}] %}`
          : '');

        /* istanbul ignore else */
        if (task.value.usage) {
          logger.info('  {% gray %s %}\n',
            task.value.usage.split('\n').join('\n  '));
        }
      });
    }

    return haki.chooseGeneratorList(_.extend({}, $.data, $.params));
  }

  Promise.resolve()
    .then(() => _run())
    .catch(err => {
      _.printError(err, $.flags, logger);
      _.die(1);
    });
};
