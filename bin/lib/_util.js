'use strict';

/* eslint-disable prefer-rest-params */
/* eslint-disable no-eval */

const reWithSpacesG = /\b([[\]\w.]+)=(?:(['"])[^\2]+\2)/g;
const reWithSpaces = /\b([[\]\w.]+)=(?:(['"])([^\2]+)\2)/;

const reWithoutSpacesG = /\b([[\]\w.]+)=(?!['"])(\S+)/g;
const reWithoutSpaces = /\b([[\]\w.]+)=(?!['"])(\S+)/;

const reSingleBoolG = /--(\w+)[\s=]?((?!--).*)?/g;
const reSingleBool = /--(\w+)[\s=]?((?!--).*)?/;

function _getRequestParams(value) {
  const body = {};
  const opts = {};

  const withSpaces = value.match(reWithSpacesG);

  if (withSpaces) {
    withSpaces.forEach((str) => {
      str = str.match(reWithSpaces);
      if (str[1]) {
        body[str[1]] = str[3];
      }
    });

    value = value.replace(reWithSpacesG, '');
  }

  const withoutSpaces = value.match(reWithoutSpacesG);

  if (withoutSpaces) {
    withoutSpaces.forEach((str) => {
      str = str.match(reWithoutSpaces);
      if (str[1]) {
        body[str[1]] = str[2];
      }
    });

    value = value.replace(reWithoutSpacesG, '');
  }

  const singleBool = value.match(reSingleBoolG);

  if (singleBool) {
    singleBool.forEach((str) => {
      str = str.match(reSingleBool);
      if (str[1]) {
        opts[str[1]] = typeof str[2] === 'undefined' ? true : str[2];
      }
    });

    value = value.replace(reSingleBoolG, '');
  }

  value.trim().split(/\s+/).forEach((key) => {
    if (key) {
      body[key] = '1';
    }
  });

  opts.body = body;

  return opts;
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
  clearModules: _clearModules,
  requestParams: _getRequestParams,
};
