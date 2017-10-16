'use strict';

/* eslint-disable global-require */

const util = require('../../lib/util');

const path = require('path');

module.exports = ($, cwd, logger) => {
  const _cmd = $._.shift();

  const Haki = require('haki');

  const haki = new Haki(cwd, util.extend({}, $.flags, { data: $._, params: $.params }));

  // common helpers
  haki.addHelper('normalize', (text, render) =>
    render(text).replace(/\./g, '/'));

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
      return haki.runGenerator(_cmd, util.extend({}, $.data));
    }

    /* istanbul ignore else */
    if ($.flags.list) {
      return haki.getGeneratorList().forEach(task => {
        if (_cmd && task.gen.indexOf(_cmd) === -1) {
          return;
        }

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

    return haki.chooseGeneratorList(util.extend({}, $.data));
  }

  Promise.resolve()
    .then(() => _run())
    .catch(err => {
      util.printError(err, $.flags, logger);
      util.die(1);
    });
};
