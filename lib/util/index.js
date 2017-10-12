'use strict';

const STATUS_CODES = require('http').STATUS_CODES;

const objectNew = require('object-new');

const reEntityLT = /</g;
const reEntityGT = />/g;
const reEntityQT = /"/g;
const reSegments = /[/-]/;

function ents(str) {
  return str
    .replace(reEntityLT, '&lt;')
    .replace(reEntityGT, '&gt;')
    .replace(reEntityQT, '&quot;');
}

function ucwords(value, separator, ucfirstLetter) {
  value = value.split(reSegments)
    .filter(x => x)
    .map(x => x[0].toUpperCase() + x.substr(1))
    .join(typeof separator !== 'undefined' ? separator : ' ');

  if (ucfirstLetter === false) {
    return value[0].toLowerCase() + value.substr(1);
  }

  return value;
}

function safeJSON(obj, depth) {
  const seen = [];

  return JSON.stringify(obj, (k, v) => {
    if (k.charAt() === '_' || typeof v === 'function') {
      return;
    }

    if (seen.indexOf(v) !== -1) {
      return '[Circular]';
    }

    if (v && typeof v === 'object') {
      seen.push(v);
    }

    if (v instanceof RegExp) {
      return v.toString();
    }

    if (v instanceof Date) {
      return v.toISOString();
    }

    return v;
  }, 2)
  .split('\n')
  .join(`\n${new Array((depth || 0) + 1).join('  ')}`)
  .replace(/(?:\w|"|'|\}|\])$/gm, '$&,')
  .replace(/"(\$?\w+)":/g, '$1:')
  .replace(/"([^'"]*?)"/g, "'$1'")
  .replace(/,$/, '');
}

function safeValue(str, html) {
  if (Array.isArray(str)) {
    return `[${str.map(x => safeValue(x, html)).join(', ')}]`;
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

function load(context, handler, name) {
  // read from memory first
  let Handler = handler.original;

  /* istanbul ignore else */
  if (!Handler && handler.filepath) {
    // lazily load and set the original module
    Handler
      = handler.original
      = require(handler.filepath);

    if (!Array.isArray(Handler)) {
      // object-new support
      if (typeof Handler.init === 'function' || Handler.methods) {
        Handler = objectNew(name, Handler, context);
      } else {
        context[name] = Handler;
      }

      // using classes?
      const isClass =
        typeof Handler === 'function'
        && Handler.constructor && Handler.name;

      // class-like constructors are always instantiated
      handler.instance = isClass ? new Handler() : Handler;
    }
  }

  return Handler;
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

// https://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate/14801711#14801711
function searchCache(moduleName, callback) {
  const mod = require.resolve(moduleName);

  if (mod && typeof require.cache[mod] !== 'undefined') {
    (function traverse(_mod) {
      _mod.children.forEach(child => {
        traverse(child);
      });

      callback(_mod);
    }(require.cache[mod]));
  }
}

function purgeCache(moduleName) {
  searchCache(moduleName, mod => {
    delete require.cache[mod.id];
  });

  Object.keys(module.constructor._pathCache).forEach(cacheKey => {
    if (cacheKey.indexOf(moduleName) > 0) {
      delete module.constructor._pathCache[cacheKey];
    }
  });
}

function clearModules(cwd) {
  Object.keys(require.cache)
    .filter(key =>
      key.indexOf(cwd) === 0 && key.indexOf('node_modules') === -1)
    .forEach(purgeCache);
}

module.exports = {
  get: _get,
  set: _set,
  props,
  ucwords,
  safeJSON,
  safeValue,
  setProperty,
  clearModules,
  statusErr,
  extend,
  load,
};
