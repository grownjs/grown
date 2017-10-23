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
    if (!($.flags.list || $.flags.help) && _cmd) {
      return haki.runGenerator(_cmd, util.extend({
        APPLICATION: path.relative(cwd, $.flags.app),
      }, $.data));
    }

    /* istanbul ignore else */
    if ($.flags.list || $.flags.help) {
      let found;

      haki.getGeneratorList().forEach(task => {
        if (_cmd && (task.gen !== _cmd)) {
          return;
        }

        found = true;

        logger.printf('\r{% link %s %}\r\n', task.value.description || task.name);
        logger.printf('  {% bold %s %}%s%s\n', task.gen, task.value.arguments
          ? ` {% gray [${task.value.arguments.join('] [')}] %}`
          : '', task.value.options
          ? ` {% gray [${typeof task.value.options === 'string'
            ? task.value.options.toUpperCase()
            : 'OPTIONS'}] %}`
          : '');

        /* istanbul ignore else */
        if (task.value.usage && $.flags.help) {
          logger.printf('\n  %s\n\n',
            task.value.usage.split('\n').join('\n  ').trim());
        }
      });

      if (!found) {
        throw new Error(`The '${_cmd}' generator does not exists`);
      }

      return;
    }

    return haki.chooseGeneratorList(util.extend({}, $.data));
  }

  Promise.resolve()
    .then(() => _run())
    .catch(err => {
      util.printError(err, $.flags, logger, true);
      util.die(1);
    });
};
