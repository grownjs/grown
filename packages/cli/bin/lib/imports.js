'use strict';

const path = require('path');

module.exports = (Grown, util, ctx) => {
  const use = (ctx && ctx._ && ctx._[0]) || Grown.argv.flags.import;

  /* istanbul ignore else */
  if (!use || typeof use !== 'string') {
    throw new Error(`Missing --import to load, given '${use || ''}'`);
  }

  const container = require(path.resolve(Grown.cwd, use));

  if (!container || typeof container !== 'object' || Array.isArray(container)) {
    throw new Error(`Expecting an object, given '${typeof container}'`);
  }

  Object.keys(container).forEach(x => {
    ctx.repl.context[x] = container[x];
  });

  const names = Object.keys(container);
  const count = names.length;
  const suffix = count === 1 ? '' : 's';

  Grown.Logger.getLogger()
    .printf('{% info %s symbol%s found: %} %s\r\n', count, suffix, names.join(', '));

  return container;
};
