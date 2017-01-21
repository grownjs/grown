'use strict';

/* eslint-disable prefer-rest-params */

const die = process.exit.bind(process);
const _slice = Array.prototype.slice;

function echo() {
  process.stdout.write(_slice.call(arguments).join(''));
}

function parseBool(value) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

module.exports = {
  die,
  echo,
  slice: _slice,
  toBool: parseBool,
};
