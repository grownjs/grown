'use strict';

/* eslint-disable prefer-rest-params */
/* eslint-disable no-eval */
const reValueWithSpaces = / ((?!-)[\w.]+)=(["'][^"']+["']) /g;
const reFlagWithSpaces = / -+([\w.]+)[=\s](["'][^"']+["']) /g;
const reTrimTrailingDashes = /^-+/g;
const reMatchKeyValue = /^[\w.-]+=/;

function _inputProps(value, cb) {
  const data = {};
  const flags = {};
  const params = {};

  function e(val) {
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
  }).join(' ') : value} `;

  // value="with spaces"
  value = value.replace(reValueWithSpaces, (_, $1, $2) => {
    data[$1] = e($2.substr(1, $2.length - 2));
    return ' ';
  });

  // --flag "with spaces"
  value = value.replace(reFlagWithSpaces, (_, $1, $2) => {
    flags[$1] = $2.substr(1, $2.length - 2);
    return ' ';
  });

  value.split(/\s+/).reduce((prev, cur) => {
    if (prev === true) {
      return cur;
    }

    let offset;

    if (reMatchKeyValue.test(cur)) {
      offset = cur.indexOf('=');

      const k = cur.substr(0, offset);
      const v = cur.substr(offset + 1);

      if (k.charAt() === '-') {
        flags[k.replace(reTrimTrailingDashes, '')] = v;
      } else {
        data[k] = e(v);
      }

      if (prev.charAt() === '-') {
        flags[prev.replace(reTrimTrailingDashes, '')] = true;
        return true;
      }

      return prev;
    }

    if (prev.charAt() === '-') {
      if (cur.charAt() !== '-') {
        flags[prev.replace(reTrimTrailingDashes, '')] = cur || true;
        return true;
      }

      flags[prev.replace(reTrimTrailingDashes, '')] = true;
      return cur;
    }

    if (prev) {
      if (prev.indexOf(':') === -1) {
        data[prev] = '1';
      } else {
        offset = prev.indexOf(':');
        params[prev.substr(0, offset)] = prev.substr(offset + 1);
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
