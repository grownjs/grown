'use strict';

/* eslint-disable global-require */

const path = require('path');

module.exports = ($, cwd, logger) => {
  const _ = require('../lib/util');

  const _cmd = $._.shift();

  const Haki = require('haki');

  const haki = new Haki(cwd, _.extend({}, $.flags, { data: $._, params: $.params }));

  // common helpers
  haki.addHelper('resource', (text, render) =>
    render(text).split('.').pop());

  haki.addHelper('keypath', (text, render) => {
    const y = render(text).split('.');
    y.pop();
    return y.join('.');
  });

  haki.addHelper('basename', (text, render) => path.basename(render(text)));
  haki.addHelper('dirname', (text, render) => path.dirname(render(text)));

  haki.load(require.resolve('../skel/generate'));

  function _run() {
    /* istanbul ignore else */
    if (!$.flags.list && _cmd) {
      return haki.runGenerator(_cmd, _.extend({}, $.data));
    }

    /* istanbul ignore else */
    if ($.flags.list) {
      return haki.getGeneratorList().forEach(task => {
        logger.info('\r{% link %s %}\r\n', task.value.description || task.name);
        logger.info('  {% bold g %s %}%s\n', task.gen, task.value.arguments
          ? ` {% gray [${task.value.arguments.join('] [')}] %}`
          : '');

        /* istanbul ignore else */
        if (task.value.usage) {
          logger.info('\n  %s\n',
            task.value.usage.split('\n').join('\n  ').trim());
        }
      });
    }

    return haki.chooseGeneratorList(_.extend({}, $.data));
  }

  Promise.resolve()
    .then(() => _run())
    .catch(err => {
      _.printError(err, $.flags, logger);
      _.die(1);
    });
};
