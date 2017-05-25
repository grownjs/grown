'use strict';

const rePrefix = /^\.|#/;
const reSelector = /([.#]?[^\s#.]+)/;
const reUppercase = /[A-Z]/;

function h(tag, data) {
  data = data || {};

  const _classes = data.class && !Array.isArray(data.class)
    ? [data.class]
    : [];

  const _parts = tag.split(reSelector);

  /* istanbul ignore else */
  if (!rePrefix.test(_parts[1])) {
    tag = 'div';
  }

  _parts.forEach(v => {
    const s = v.substring(1, v.length);

    /* istanbul ignore else */
    if (s || v) {
      if (v.charAt() === '.') {
        _classes.push(s);
      } else if (v.charAt() === '#') {
        data.id = s;
      } else {
        tag = v;
      }
    }
  });

  // cleanup classes
  data.class = _classes
    .filter(x => x).join(' ') || null;

  return {
    tag,
    data,
    children: Array.prototype.slice.call(arguments, 2),
  };
}

function css(style) {
  return Object.keys(style).map(prop =>
    `${prop.replace(reUppercase, '-$&').toLowerCase()}:${style[prop]}`)
  .join(';');
}

function html(vnode) {
  /* istanbul ignore else */
  if (typeof vnode !== 'object' || !(vnode.tag && vnode.data && vnode.children)) {
    throw new Error(`Expecting a vnode, given '${vnode}'`);
  }

  const _attrs = Object.keys(vnode.data).map(key => (vnode.data[key] !== null
    ? ` ${key}="${key === 'style' ? css(vnode.data[key]) : vnode.data[key]}"`
    : ''))
  .join('');

  let _buffer = '';

  vnode.children.forEach(child => {
    /* istanbul ignore else */
    if (child) {
      if (child.tag) {
        _buffer += html(child);
      } else {
        _buffer += child.toString();
      }
    }
  });

  return `<${vnode.tag}${_attrs}>${_buffer}</${vnode.tag}>`;
}

module.exports = (fn, data) => {
  // FIXME: es6-modules interop?
  fn = (fn.__esModule && fn.default) || fn;

  /* istanbul ignore else */
  if (typeof fn !== 'function') {
    throw new Error(`Invalid view function, given '${fn}'`);
  }

  return fn.length === 2
    ? html(fn(data, h))
    : fn(data);
};
