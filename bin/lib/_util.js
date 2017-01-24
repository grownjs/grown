'use strict';

/* eslint-disable prefer-rest-params */
/* eslint-disable no-eval */
const reValueWithSpaces = / ((?!-)[\w.]+)=(["'][^"']+["']) /g;
const reFlagWithSpaces = / -+([\w.]+)[=\s](["'][^"']+["']) /g;
const reTrimLeadingDashes = /^-+/g;
const reMatchKeyValue = /^[\w.-]+=/;

function _inputProps(value, opts, cb) {
  const data = {};
  const flags = {};
  const params = {};

  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  // defaults
  opts = opts || {};
  opts.default = typeof opts.default !== 'undefined'
    ? opts.default : true;

  cb = typeof opts.format === 'function' ? opts.format : cb;

  function e(val) {
    // "unescape" quotes
    val = val.replace(/__QUOTE__/g, '"');
    val = val.replace(/__APOS__/g, "'");

    if (typeof cb === 'function') {
      return cb(val);
    }

    return val;
  }

  // "normalize" input
  value = ` ${Array.isArray(value) ? value.map((x) => {
    if (x.indexOf(' ') === -1) {
      return x;
    }

    const offset = x.indexOf('=');

    if (offset === -1) {
      return `"${x}"`;
    }

    return `${x.substr(0, offset)}="${x.substr(offset + 1)}"`;
  }).join(' - ') : value || ''} `;

  // "escape" quotes
  value = value.replace(/\\"/g, '__QUOTE__');
  value = value.replace(/\\'/g, '__APOS__');

  // value="with spaces"
  value = value.replace(reValueWithSpaces, (_, $1, $2) => {
    data[$1] = e($2.substr(1, $2.length - 2));
    return ' - ';
  });

  // --flag "with spaces"
  value = value.replace(reFlagWithSpaces, (_, $1, $2) => {
    flags[$1] = e($2.substr(1, $2.length - 2));
    return ' - ';
  });

  value.split(/\s+/).reduce((prev, cur) => {
    const key = prev.replace(reTrimLeadingDashes, '');

    if (prev === true || !key) {
      return cur;
    }

    let offset;

    if (reMatchKeyValue.test(cur)) {
      offset = cur.indexOf('=');

      const k = cur.substr(0, offset);
      const v = cur.substr(offset + 1);

      if (k.charAt() === '-') {
        flags[k.replace(reTrimLeadingDashes, '')] = e(v);
      } else {
        data[k] = e(v);
      }

      if (prev.charAt() === '-') {
        flags[key] = true;
        return true;
      }

      return prev;
    }

    if (prev.charAt() === '-') {
      if (cur.charAt() !== '-') {
        flags[key] = e(cur) || true;
        return true;
      }

      flags[key] = true;
      return cur;
    }

    if (prev) {
      if (prev.indexOf(':') === -1) {
        data[prev] = opts.default;
      } else {
        offset = prev.indexOf(':');
        params[prev.substr(0, offset)] = e(prev.substr(offset + 1));
      }
    }

    return cur;
  }, '');

  return { data, flags, params };
}

// runtime hooks
const Module = require('module');

function _clearModules() {
  Object.keys(Module._cache)
    .forEach((key) => {
      /* istanbul ignore else */
      if (key.indexOf('node_modules') === -1) {
        delete Module._cache[key];
      }
    });
}

const die = process.exit.bind(process);
const _slice = Array.prototype.slice;

function echo() {
  process.stdout.write(_slice.call(arguments).join(''));
}

function merge(target) {
  _slice.call(arguments, 1).forEach((source) => {
    Object.keys(source).forEach((key) => {
      /* istanbul ignore else */
      if (typeof target[key] === 'undefined') {
        target[key] = source[key];
      }
    });
  });

  return target;
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
  merge,
  slice: _slice,
  toBool: parseBool,
  inputProps: _inputProps,
  clearModules: _clearModules,
};
