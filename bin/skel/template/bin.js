#!/bin/sh

':' // ; exec "$(command -v nodejs || command -v node)" "$0" "$@"
;

'use strict';

let _closing;

const app = require('../app/server');

process.stdout.write('Loading server...\r');

function runApplication() {
  function main() {
    process.stdout.write('Starting framework...\r');

    const farm = app();

    return farm.run(() =>
      farm.listen(process.env.PORT || '8080', $ => {
        process.stdout.write(`Listening on ${$.location.href} [press CTRL-C to quit]\n`);
      }).catch(error => {
        process.stderr.write(`${error.toString()}\n`);
        process.exit(1);
      }));
  }

  if (!_closing) {
    main();
  } else {
    process.stdout.write('Closing previous instance...\r');
    setTimeout(runApplication, 100);
  }

  return () => {
    _closing = true;

    return app.teardown(() => {
      _closing = false;
    });
  };
}

if (require.main === module) {
  runApplication();
}

module.exports = () => runApplication();
