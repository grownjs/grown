'use strict';

// just the first line is used as description,
// the rest is shown when --help is used

const USAGE_INFO = `

It will print any given messages

--mirror   Invert whole output before print
--reverse  Invert words before print

Examples:
  bin/cli words hello world --mirror

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown) {
    const words = Grown.argv._.slice();

    if (!words.length) {
      throw new Error('Missing words');
    }

    let output = words.join(' ');

    if (Grown.argv.flags.mirror) {
      output = output.split('').reverse().join('');
    }

    if (Grown.argv.flags.reverse) {
      output = words.reverse().join(' ');
    }

    Grown.Logger.message(output);
  },
};
