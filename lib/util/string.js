'use strict';

const reEntityLT = /</g;
const reEntityGT = />/g;
const reEntityQT = /"/g;
const reSegments = /[/-]/;

function _ents(str) {
  return str
    .replace(reEntityLT, '&lt;')
    .replace(reEntityGT, '&gt;')
    .replace(reEntityQT, '&quot;');
}

function _ucwords(value, separator, ucfirstLetter) {
  value = value.split(reSegments)
    .filter(x => x)
    .map(x => x[0].toUpperCase() + x.substr(1))
    .join(typeof separator !== 'undefined' ? separator : ' ');

  if (ucfirstLetter === false) {
    return value[0].toLowerCase() + value.substr(1);
  }

  return value;
}

function _serialize(obj, depth, entities) {
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

    if (entities) {
      return _ents(v);
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

function _stringify(str, html) {
  if (Array.isArray(str)) {
    return `[${str.map(x => _stringify(x, html)).join(', ')}]`;
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
    str = _serialize(str, html);
  }

  return str.toString();
}

module.exports = {
  ents: _ents,
  ucwords: _ucwords,
  serialize: _serialize,
  stringify: _stringify,
};
