'use strict';

const STATUS_CODES = require('http').STATUS_CODES;

const objectNew = require('object-new');

const reEntityLT = /</g;
const reEntityGT = />/g;
const reEntityQT = /"/g;

function ents(str) {
  return str
    .replace(reEntityLT, '&lt;')
    .replace(reEntityGT, '&gt;')
    .replace(reEntityQT, '&quot;');
}

function safeJSON(obj) {
  const seen = [];

  return JSON.stringify(obj, (k, v) => {
    if (k.charAt() === '_' || typeof v === 'function') {
      return;
    }

    if (seen.indexOf(v) !== -1) {
      return '*CIRCULAR*';
    }

    if (v && typeof v === 'object') {
      seen.push(v);
    }

    return v;
  }, 2);
}

function safeValue(str, html) {
  if (Array.isArray(str)) {
    return `[ ${str.map(safeValue).join(', ')} ]`;
  }

  if (typeof str === 'string' && !str.length) {
    return html
      ? '<span class="empty">EMPTY</span>'
      : 'EMPTY';
  }

  if (str === null || typeof str === 'undefined') {
    return html
      ? `<span class="empty">${str}</span>`
      : String(str);
  }

  if (typeof str === 'object') {
    str = safeJSON(str);
  }

  if (html) {
    return ents(str.toString());
  }

  return str.toString();
}

// standard http error-codes
function statusErr(code, description) {
  const message = STATUS_CODES[code];
  const errObj = new Error(description || message);

  errObj.statusMessage = message;
  errObj.statusCode = code;

  return errObj;
}

function setProperty(obj, key, value) {
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
    setProperty(target, 'map', cb => source.map(cb));
    setProperty(target, 'filter', cb => source.filter(cb));
    setProperty(target, 'forEach', cb => source.forEach(cb));
  } else {
    setProperty(target, 'map', cb => Object.keys(source).map(k => cb(source[k], k)));
    setProperty(target, 'filter', cb => Object.keys(source).filter(k => cb(source[k], k)));
    setProperty(target, 'forEach', cb => Object.keys(source).forEach(k => cb(source[k], k)));
  }

  return target;
}

// resolve objects containing promises/streams
function props(obj, cb) {
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
  props,
  safeJSON,
  safeValue,
  setProperty,
  proxyArray,
  statusErr,
  extend,
  load,
};
