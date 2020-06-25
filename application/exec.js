require('logro').setForbiddenFields(require('./api/forbidden.json'));

const fs = require('fs');
const path = require('path');

async function run() {
  const main = process.argv.slice(2)[0];

  if (main && fs.existsSync(main)) {
    const callback = require(path.resolve(main));

    if (typeof callback === 'function') {
      await callback(require('./etc'), require('./etc/shared'));
    }
  }
}
run();
