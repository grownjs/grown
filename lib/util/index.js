'use strict';

/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-spread */

const STATUS_CODES = require('http').STATUS_CODES;

// standard http error-codes
function statusErr(code, description) {
  const message = STATUS_CODES[code];
  const errObj = new Error(description || message);

  errObj.statusMessage = message;
  errObj.statusCode = code;

  return errObj;
}

// resolve objects containing promises
function reduce(obj, cb) {
  const temp = {};

  Object.keys(obj).forEach((key) => {
    const value = cb ? cb(obj[key], key) : obj[key];

    if (typeof value !== 'undefined' && value !== null) {
      temp[key] = value;
    }
  });

  return Promise.all(Object.keys(temp).map(key =>
    Promise.resolve(temp[key]).then((value) => {
      temp[key] = value;
    })))
  .then(() => temp);
}

// basic merge utility
function extend(target) {
  const args = Array.prototype.slice.call(arguments, 1);

  args.forEach((source) => {
    Object.keys(source).forEach((key) => {
      /* istanbul ignore else */
      if (typeof target[key] === 'undefined') {
        target[key] = source[key];
      }
    });
  });

  return target;
}

module.exports = {
  statusErr,
  reduce,
  extend,
};
