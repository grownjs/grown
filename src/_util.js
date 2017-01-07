// resolve objects containing promises
export function reduce(obj) {
  return Promise.all(Object.keys(obj).map(key =>
    Promise.resolve(obj[key]).then((value) => {
      obj[key] = value;
    })));
}

// basic merge utility
export function extend(target, ...args) {
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
export function methods(target, obj) {
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
export function props(target, _props, state = {}) {
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
