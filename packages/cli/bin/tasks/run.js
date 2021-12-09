'use strict';

/* istanbul ignore file */

const path = require('path');

const USAGE_INFO = `

  Execute arbitrary scripts

  --load  Optional. Load module before the script

  Examples:
    {bin} run path/to/script other/script
    {bin} run --load api/models path/to/script

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const load = util.flattenArgs(Grown.argv.flags.load).filter(Boolean);
    const run = Grown.argv._.slice(1);

    load.forEach(src => {
      Grown.use(require(path.resolve(src)));
    });

    return Promise.resolve()
      .then(() => run.reduce((prev, task) => prev.then(() => require(path.resolve(task))(Grown, util)), Promise.resolve()))
      .catch(e => {
        Grown.Logger.getLogger()
          .printf('\r{% error. %s %}\n', (Grown.argv.flags.verbose && e.stack) || e.message);
      });
  },
};
