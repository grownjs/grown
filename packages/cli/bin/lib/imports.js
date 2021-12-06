'use strict';

const path = require('path');

module.exports = (Grown, util, ctx) => {
  const use = (ctx && ctx._ && ctx._[0]) || Grown.argv.params.import;

  /* istanbul ignore else */
  if (!use || typeof use !== 'string') {
    throw new Error(`Missing --import to load, given '${use || ''}'`);
  }

  let container = require(path.resolve(Grown.cwd, use));
  if (typeof container === 'function') {
    container = container(Grown, util);

    if (container && container.extensions && container.name) {
      container = { [container.name]: container };
    }
  }

  if (!container || typeof container !== 'object' || Array.isArray(container)) {
    throw new Error(`Expecting an object, given '${typeof container}'`);
  }

  const names = [];
  Object.keys(container).forEach(x => {
    const key = x.replace(/\W/g, '');

    names.push(key);
    ctx.repl.context[key] = container[x];
  });

  const count = names.length;
  const suffix = count === 1 ? '' : 's';

  Grown.Logger.getLogger()
    .printf('\r{% info. %s symbol%s found: %} %s\n', count, suffix, names.join(', '));

  return container;
};
