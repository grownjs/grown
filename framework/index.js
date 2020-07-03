'use strict';

const fs = require('fs');
const path = require('path');

async function main(opts) {
  const Grown = require('./lib')(require('..')(), opts || {});

  Grown.ApplicationServer.getServer()
    .listen(Grown.argv.flags.port || 3000)
    .catch(e => {
      process.stderr.write(e.stack);
      process.exit(1);
    });
}

async function exec(opts) {
  const Grown = require('./lib')(require('..')(), opts || {});
  const script = Grown.argv._[0];

  if (script && fs.existsSync(script)) {
    const callback = require(path.resolve(script));

    if (typeof callback === 'function') {
      await Grown.ApplicationServer.start();
      await callback(Grown);
      process.exit();
    }
  }
}

module.exports = { main, exec };
