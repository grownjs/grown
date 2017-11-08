'use strict';

function _is(type, value) {
  if (Object.prototype.toString.call(value).match(/ (\w+)/)[1].toLowerCase() !== type) {
    throw new Error(`Expecting a ${type}, given '${value}'`);
  }
}

function _get(source, key, defvalue) {
  const keys = key.split('.');

  let obj = source;

  try {
    while (keys.length) {
      key = keys.shift();

      if (!key) {
        break;
      }

      obj = obj[key];
    }
  } catch (e) {
    // do nothing
  }

  if (typeof obj === 'undefined' && typeof defvalue === 'undefined') {
    throw new Error(`Missing property for: ${key}`);
  }

  if (typeof obj === 'undefined' && defvalue instanceof Error) {
    throw defvalue;
  }

  return typeof obj === 'undefined'
    ? defvalue
    : obj;
}

function _set(target, key, value) {
  const keys = key.split('.');

  let obj = target;

  try {
    do {
      key = keys.shift();

      if (!keys.length) {
        break;
      }

      if (!obj[key]) {
        obj[key] = {};
      }

      obj = obj[key];
    } while (keys.length);

    obj[key] = value;
  } catch (e) {
    throw new Error(`Cannot set property '${key}'`);
  }
}

// resolve objects containing promises/streams
function _props(obj, cb) {
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
function _object(value) {
  return typeof value === 'object' || typeof value === 'function';
}

function _merge(target, obj) {
  Object.keys(obj).forEach(key => {
    const oldVal = obj[key];
    const newVal = target[key];

    if (_object(newVal) && _object(oldVal)) {
      target[key] = _merge(newVal, oldVal);
    } else if (Array.isArray(newVal)) {
      target[key] = Array.prototype.concat.call([], newVal, oldVal);
    } else {
      target[key] = oldVal;
    }
  });

  return target;
}

function _extend(target) {
  let values = Array.prototype.slice.call(arguments, 1);
  let merge = false;

  if (Array.isArray(arguments[0])) {
    values = arguments[0];
    target = {};
    merge = true;
  }

  values.forEach(source => {
    /* istanbul ignore else */
    if (source && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        /* istanbul ignore else */
        if (!merge && typeof target[key] === 'undefined') {
          target[key] = source[key];
        }

        if (merge) {
          target[key] = _merge(target[key] || {}, source[key]);
        }
      });
    }
  });

  return target;
}

module.exports = {
  is: _is,
  get: _get,
  set: _set,
  props: _props,
  extend: _extend,
};
