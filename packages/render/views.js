'use strict';

const debug = require('debug')('grown:render');

const path = require('path');
const fs = require('fs');

const RE_PREFIX = /^\.|#/;
const RE_SELECTOR = /([.#]?[^\s#.]+)/;
const RE_UPPERCASE = /[A-Z]/;

const SELF_CLOSING_ELEMENTS = ['br', 'img', 'link', 'meta'];

const _util = require('util');

function buildvNode(tag, data) {
  data = data || {};

  const _classes = data.class && !Array.isArray(data.class)
    ? [data.class]
    : [];

  const _parts = tag.split(RE_SELECTOR);

  /* istanbul ignore else */
  if (!RE_PREFIX.test(_parts[1])) {
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

function buildCSS(style) {
  return Object.keys(style).map(prop =>
    `${prop.replace(RE_UPPERCASE, '-$&').toLowerCase()}:${style[prop]}`)
    .join(';');
}

function buildAttr(key, value) {
  if (typeof value === 'boolean') {
    /* istanbul ignore else */
    if (value) {
      return ` ${key}`;
    }
  } else if (value !== null) {
    return ` ${key}="${key === 'style'
      ? this.buildCSS(value)
      : value}"`;
  }
}

function buildHTML(vnode, depth) {
  /* istanbul ignore else */
  if (Array.isArray(vnode)) {
    return vnode.map(x => this.buildHTML(x, depth));
  }

  /* istanbul ignore else */
  if (typeof vnode !== 'object' || !(vnode.tag && vnode.data && vnode.children)) {
    throw new Error(`Expecting a vnode, given '${_util.inspect(vnode)}'`);
  }

  const _attrs = Object.keys(vnode.data)
    .map(key => this.buildAttr(key, vnode.data[key]))
    .filter(x => x)
    .join('');

  let _buffer = '';

  const _suffix = `\n${new Array(depth || 1).join('  ')}`;

  /* istanbul ignore else */
  if (vnode.children) {
    /* istanbul ignore else */
    if (this.SELF_CLOSING_ELEMENTS.indexOf(vnode.tag) > -1) {
      throw new Error(`Unexpected children for ${vnode.tag}, given ${_util.inspect(vnode.children)}`);
    }

    vnode.children.forEach(child => {
      /* istanbul ignore else */
      if (child) {
        if (child.tag) {
          _buffer += this.buildHTML(child, (depth || 1) + 1);
        } else {
          _buffer += child.toString();
        }
      }
    });

    const _prefix = `\n${new Array((depth || 1) + 1).join('  ')}`;

    return `<${vnode.tag}${_attrs}>${_prefix}${_buffer}${_suffix}</${vnode.tag}>`;
  }

  return `<${vnode.tag}${_attrs}${vnode.tag.charAt() !== '!' ? '/' : ''}>${_suffix}`;
}

function buildPartial(view, data) {
  /* istanbul ignore else */
  if (typeof view !== 'object') {
    view = { src: view, data };
  }

  data = view.data || data || {};

  const block = view.as || data.as || (typeof view.src === 'string'
    ? view.src.split('/').pop()
    : 'yield');

  delete data.as;

  return {
    data,
    block,
    src: view.src,
    fallthrough: view.fallthrough,
  };
}

function _render(fn, data) {
  // es6-modules interop
  fn = (fn.__esModule && fn.default) || fn;

  /* istanbul ignore else */
  if (typeof fn !== 'function') {
    throw new Error(`Invalid view function, given '${fn}'`);
  }

  return fn.length === 2
    ? this.buildHTML(fn(data, this.buildvNode))
    : fn(data);
}

module.exports = ($, util) => {
  function _partial(view, cached, options) {
    const _ids = !Array.isArray(view.src) && view.src
      ? [view.src]
      : view.src;

    options = options || {};

    /* istanbul ignore else */
    if (!Array.isArray(_ids)) {
      throw new Error(`Expecting valid views, given '${util.inspect(view)}'`);
    }

    for (let i = 0; i < _ids.length; i += 1) {
      const _id = _ids[i];

      try {
        let _fn;

        if (typeof _id === 'function') {
          debug('Rendering function <%s>%s', _id.name || '?', view.block ? ` as ${view.block}` : '');

          _fn = _id;
        } else {
          debug('Rendering view <%s>%s', _id, view.block ? ` as ${view.block}` : '');

          /* istanbul ignore else */
          if (!cached[_id]) {
            const _file = util.findFile(_id, options.directories,
              !(view.fallthrough || options.fallthrough)
              && i === _ids.length - 1);

            /* istanbul ignore else */
            if (_file) {
              cached[_id] = {
                file: _file,
                mtime: fs.statSync(_file).mtime,
              };
            }
          }
        }

        /* istanbul ignore else */
        if (!view.data.render) {
          util.hiddenProperty(view.data, 'render', (tpl, state) =>
            render.call(this, { src: tpl, data: state || {} }, cached, options));
        }

        /* istanbul ignore else */
        if (_fn) {
          return this._render(_fn, view.data);
        }

        /* istanbul ignore else */
        if (_id && cached[_id]) {
          /* istanbul ignore else */
          if (cached[_id].file.indexOf('.js') === -1) {
            return fs.createReadStream(cached[_id].file);
          }

          /* istanbul ignore else */
          if (options.environment === 'development') {
            /* istanbul ignore else */
            if (fs.statSync(cached[_id].file).mtime - cached[_id].mtime) {
              util.clearModules(cached[_id].file);
            }
          }

          return this._render(require(cached[_id].file), view.data);
        }
      } catch (e) {
        e.summary = `Failed rendering '${_ids.join(', ')}' template`;

        throw e;
      }
    }

    /* istanbul ignore else */
    if (!fallthrough) {
      throw new Error(`Failed to render '${src}'`);
    }

    // fallback
    return '';
  }

  return $.module('Render.Views', {
    // some constants
    SELF_CLOSING_ELEMENTS,

    // export render utils
    buildPartial,
    buildvNode,
    buildHTML,
    buildAttr,
    buildCSS,
    _partial,
    _render,

    // default options
    _cache: {},
    folders: [],

    // setup extensions
    install(ctx, options) {
      console.log('VIEWS', this.class);

      const defaults = {
        directories: util.flattenArgs(this.folders),
        fallthrough: this.fallthrough,
        environment: options('env'),
      };

      this.render = (src, data) =>
        this._partial(this.buildPartial(src, data), this._cache, defaults);


      return {
        methods: {
          render: this.render,
        },
      };
    },

    mixins() {
      const self = this;

      return {
        methods: {
          view(src, data) {
            return self.render(src, data);
          },
          render(src, data) {
            const tpl = {
              view: src,
              locals: data || {},
              contents: this.view(src, data),
            };

            if (self._write) {
              self._write(this, tpl);
            }

            if (typeof this.end === 'function') {
              this.end(tpl.contents);
            } else {
              this.res.write(tpl.contents);
            }
          },
        },
      };
    },
  });
};
