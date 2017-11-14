'use strict';

const debug = require('debug')('grown:render');

const path = require('path');
const fs = require('fs');

const RE_PREFIX = /^\.|#/;
const RE_SELECTOR = /([.#]?[^\s#.]+)/;
const RE_UPPERCASE = /[A-Z]/;

const SELF_CLOSE = ['br', 'img', 'link', 'meta', '!doctype'];

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
      ? buildCSS(value)
      : value}"`;
  }
}

function buildHTML(vnode, depth) {
  /* istanbul ignore else */
  if (Array.isArray(vnode)) {
    return vnode.map(x => buildHTML(x, depth)).map(x => x.trim()).join('\n');
  }

  /* istanbul ignore else */
  if (typeof vnode !== 'object' || !(vnode.tag && vnode.data && vnode.children)) {
    throw new Error(`Expecting a vnode, given '${_util.inspect(vnode)}'`);
  }

  const _attrs = Object.keys(vnode.data)
    .map(key => buildAttr(key, vnode.data[key]))
    .filter(x => x)
    .join('');

  let _buffer = '';

  const _suffix = `\n${new Array(depth || 1).join('  ')}`;

  if (SELF_CLOSE.indexOf(vnode.tag) == -1) {
    vnode.children.forEach(child => {
      /* istanbul ignore else */
      if (child) {
        if (child.tag) {
          _buffer += buildHTML(child, (depth || 1) + 1);
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

function executeTpl(fn, data) {
  // es6-modules interop
  fn = (fn.__esModule && fn.default) || fn;

  /* istanbul ignore else */
  if (typeof fn !== 'function') {
    throw new Error(`Invalid view function, given '${fn}'`);
  }

  return fn.length === 2
    ? buildHTML(fn(data, buildvNode))
    : fn(data);
}

module.exports = ($, util) => {
  function render(view, cached, options) {
    const _ids = !Array.isArray(view.src) && view.src
      ? [view.src]
      : view.src;

    options = options || {};

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
          view.data.render = (tpl, state) =>
            render({ src: tpl, data: state || {} }, cached, options);
        }

        /* istanbul ignore else */
        if (_fn) {
          return executeTpl(_fn, view.data);
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

          return executeTpl(require(cached[_id].file), view.data);
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
    // export render utils
    buildPartial,
    buildvNode,
    buildHTML,
    buildAttr,
    buildCSS,
    render,

    // setup extensions
    install(ctx, options) {
      const env = options('env');

      const _folders = [];
      const _views = {};

      if (this.folders) {
        util.flattenArgs(this.folders)
          .forEach(cwd => {
            _folders.push(cwd);
          });
      }

      return {
        methods: {
          render(src, data) {
            return render(buildPartial(src, data), _views, {
              fallthrough: this.fallthrough,
              directories: _folders,
              environment: env,
            });
          },
        },
      };
    },
  });
};
