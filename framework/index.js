'use strict';

// const fs = require('fs');
// const path = require('path');

// async function run() {
//   const Grown = require('@grown/crop');
//   const main = Grown.argv._[0];

//   if (main && fs.existsSync(main)) {
//     const callback = require(path.resolve(main));

//     if (typeof callback === 'function') {
//       await Grown.ApplicationServer.start();
//       await callback(Grown);
//       process.exit();
//     }
//   }
// }
// run();


// const Grown =

// Grown.ApplicationServer.getServer()


async function main(opts) {
  const Grown = require('./lib')(require('..')(), opts || {});

  Grown.ApplicationServer.getServer()
    .listen(Grown.argv.flags.port || 3000)
    .catch(e => {
      process.stderr.write(e.stack);
      process.exit(1);
    });
}

async function exec() {
  console.log('EXEC');
}

module.exports = { main, exec };
