require('logro').setForbiddenFields(require('./lib/config/forbidden'));

const fs = require('fs');
const path = require('path');

async function run() {
  const Shopfish = require('./lib');
  const main = Shopfish.argv._[0];

  if (main && fs.existsSync(main)) {
    const callback = require(path.resolve(main));

    if (typeof callback === 'function') {
      await Shopfish.ApplicationServer.start();
      await callback(Shopfish, require('./lib/shared'));
    }
  }
}
run();
