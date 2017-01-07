const STATUS_CODES = require('http').STATUS_CODES;

// standard http error-codes
function statusErr(code) {
  const message = STATUS_CODES[code];
  const errObj = new Error(message);

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
function extend(target, ...args) {
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

// inject common methods or properties
function methods(target, obj) {
  Object.keys(obj).forEach((key) => {
    // static getter
    Object.defineProperty(target, key, {
      configurable: false,
      enumerable: true,
      get() {
        if (typeof obj[key] === 'function' && !obj[key].length) {
          return obj[key]();
        }

        return obj[key];
      },
      set() {
        throw new Error(`Property '${key}' is read-only`);
      },
    });
  });
}

// inject dynamic getter/setter properties
function props(target, _props, state = {}) {
  Object.keys(_props).forEach((prop) => {
    Object.defineProperty(target, prop, {
      configurable: false,
      enumerable: true,
      get() {
        return state[prop];
      },
      set(value) {
        const oldValue = state[prop];

        state[prop] = value;

        try {
          _props[prop](value, oldValue);
        } catch (e) {
          throw e;
        }
      },
    });
  });
}

module.exports = {
  statusErr,
  reduce,
  extend,
  methods,
  props,
};
