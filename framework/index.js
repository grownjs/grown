'use strict';

const src = __dirname;

const fs = require('fs');
const path = require('path');

function getInstance(cwd, opts) {
  const Grown = require('..')(cwd);
  const nodeModules = path.join(cwd, 'node_modules/@grown');

  if (fs.existsSync(nodeModules)) {
    Grown.bind('@grown/', nodeModules);
  }

  opts = opts || {};
  opts.shared_folders = [
    path.join(cwd, 'apps'),
    path.join(__dirname, 'apps'),
  ];

  return require('./app')(Grown, opts);
}

async function main(cwd, opts) {
  const Grown = getInstance(cwd, opts);

  Grown.ApplicationServer.getServer()
    .listen(Grown.argv.flags.port || 3000)
    .catch(e => {
      process.stderr.write(e.stack);
      process.exit(1);
    });
}

async function exec(cwd, opts) {
  const Grown = getInstance(cwd, opts);
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

module.exports = { src, main, exec };
