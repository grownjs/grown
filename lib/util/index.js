'use strict';

const STATUS_CODES = require('http').STATUS_CODES;

const objectNew = require('object-new');

// standard http error-codes
function statusErr(code, description) {
  const message = STATUS_CODES[code];
  const errObj = new Error(description || message);

  errObj.statusMessage = message;
  errObj.statusCode = code;

  return errObj;
}

function _hide(obj, key, value) {
  Object.defineProperty(obj, key, {
    configurable: false,
    enumerable: false,
    writable: false,
    value,
  });
}

function proxyArray(target, source) {
  target = target || {};
  source = source || target;

  if (Array.isArray(source)) {
    _hide(target, 'map', cb => source.map(cb));
    _hide(target, 'filter', cb => source.filter(cb));
    _hide(target, 'forEach', cb => source.forEach(cb));
  } else {
    _hide(target, 'map', cb => Object.keys(source).map(k => cb(source[k], k)));
    _hide(target, 'filter', cb => Object.keys(source).filter(k => cb(source[k], k)));
    _hide(target, 'forEach', cb => Object.keys(source).forEach(k => cb(source[k], k)));
  }

  return target;
}

// resolve objects containing promises/streams
function reduce(obj, cb) {
  const temp = {};

  /* istanbul ignore else */
  if (!obj || Array.isArray(obj) || typeof obj.pipe === 'function' || typeof obj !== 'object') {
    throw new Error(`Unsupported object to props(), given: ${obj}`);
  }

  Object.keys(obj).forEach(key => {
    const value = typeof cb === 'function' ? cb(obj[key], key) : obj[key];

    /* istanbul ignore else */
    if (typeof value !== 'undefined' && value !== null) {
      temp[key] = typeof value.pipe === 'function'
        ? new Promise((resolve, reject) => {
          const chunks = [];

          value.on('error', err => reject(err));
          value.on('data', msg => chunks.push(msg));
          value.on('end', () => resolve(Buffer.concat(chunks)));
        })
        : value;
    }
  });

  return Promise.all(Object.keys(temp).map(key =>
    Promise.resolve(temp[key]).then(value => {
      temp[key] = value;
    })))
  .then(() => temp);
}

// basic merge utility
function extend(target) {
  const args = Array.prototype.slice.call(arguments, 1);

  args.forEach(source => {
    /* istanbul ignore else */
    if (source && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        /* istanbul ignore else */
        if (typeof target[key] === 'undefined') {
          target[key] = source[key];
        }
      });
    }
  });

  return target;
}

function load(extensions, handler, name) {
  // read from memory first
  let Handler = handler.original;

  /* istanbul ignore else */
  if (!Handler) {
    // lazily load and set the original module
    Handler
      = handler.original
      = require(handler.filepath);

    // object-new support
    if (typeof Handler.init === 'function' || Handler.methods) {
      Handler = objectNew(name, Handler, extensions);
    } else {
      extensions[name] = Handler;
    }

    // using classes?
    const isClass =
      typeof Handler === 'function'
      && Handler.constructor && Handler.name;

    // class-like constructors are always instantiated
    handler.instance = isClass ? new Handler() : Handler;
  }

  return Handler;
}

module.exports = {
  props: reduce,
  proxyArray,
  statusErr,
  extend,
  load,
};
