'use strict';

const debug = require('debug')('grown:render');

const errorHandler = require('../util/error');

const wargs = require('wargs');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const reDoctype = /<!doctype/;
const rePrefix = /^\.|#/;
const reSelector = /([.#]?[^\s#.]+)/;
const reUppercase = /[A-Z]/;
const reInterpolate = /`([^`]+)`/g;

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

module.exports = args => {
  const _folders = [];
  const _cachedPaths = {};

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading views from %s', cwd);

      _folders.push(cwd);
    });
  });

  function _call(fn, data) {
    // FIXME: es6-modules interop?
    fn = (fn.__esModule && fn.default) || fn;

    /* istanbul ignore else */
    if (typeof fn !== 'function') {
      throw new Error(`Invalid view function, given '${fn}'`);
    }

    return fn.length === 2
      ? html(fn(data, h))
      : fn(data);
  }

  function _lookup(src) {
    /* istanbul ignore else */
    if (fs.existsSync(src)) {
      return src;
    }

    for (let i = 0, c = _folders.length; i < c; i += 1) {
      const file = path.join(_folders[i], src);

      debug('Lookup %s', file);

      /* istanbul ignore else */
      if (fs.existsSync(`${file}.js`)) {
        return `${file}.js`;
      }

      /* istanbul ignore else */
      if (fs.existsSync(file)) {
        return file;
      }
    }

    throw new Error(`Expecting 'src' to be a valid filepath, given '${src}'`);
  }

  function _render(tpl, util, _locals) {
    const _id = tpl.src;

    try {
      let _fn;

      if (typeof _id === 'function') {
        debug('Rendering function <%s>', _id.name || '?');

        _fn = _id;
      } else {
        debug('Rendering view <%s>', _id);

        /* istanbul ignore else */
        if (!_cachedPaths[_id]) {
          _cachedPaths[_id] = _lookup(_id);
        }
      }

      return util.props(tpl.data)
        .then(locals => {
          try {
            /* istanbul ignore else */
            if (!_fn && _cachedPaths[_id].indexOf('.js') === -1) {
              return fs.createReadStream(_cachedPaths[_id]);
            }

            return _call(_fn || require(_cachedPaths[_id]), util.extend(Object.create(null), locals, _locals));
          } catch (e) {
            e.debug = {
              summary: `Render '${_id}' failed`,
              message: e.message,
              stack: e.stack,
              data: locals,
            };

            throw e;
          }
        })
        .then(result => {
          /* istanbul ignore else */
          if (typeof result === 'string' && result.indexOf('<html') > -1 && !reDoctype.test(result)) {
            // FIXME: prefix DOCTYPE on all HTML responses?
            return `<!doctype html>${result}`;
          }

          return result;
        });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  return $ => {
    const _views = [];

    function _view(conn, blocks) {
      let _layout = ((typeof conn.layout === 'undefined' ? conn.resp_locals.layout : conn.layout) !== false)
        ? (conn.resp_locals.layout || conn.layout || 'default')
        : '';

      /* istanbul ignore else */
      if (conn.handler && conn.handler._controller && conn.handler._controller.instance) {
        _layout = conn.handler._controller.instance.layout || conn.handler._controller.original.layout || _layout;
      }

      /* istanbul ignore else */
      if (_layout && typeof _layout === 'string') {
        _layout = `layouts/${_layout}`;
      }

      /* istanbul ignore else */
      if (!_layout) {
        debug('#%s Done. No layout given', conn.pid);
        return;
      }

      /* istanbul ignore else */
      if (!blocks.yield) {
        blocks.yield = conn.resp_body;
      }

      // merge with response locals
      $.util.extend(blocks, conn.resp_locals);

      return _render({ src: _layout, data: blocks }, $.util)
        .then(result => {
          conn.resp_body = result;
        })
        .catch(err => errorHandler(err, conn));
    }

    // shortcuts
    $.extensions.layout = '';
    $.extensions.render = (src, locals) =>
      _render({
        src,
        data: locals || {},
        block: typeof src === 'string' ? src.split('/').pop() : null,
      }, $.util);

    // overload connection
    $.extensions('Conn', {
      before_send() {
        /* istanbul ignore else */
        if (this.handler && this.handler._controller && this.handler._controller.instance) {
          const _partials = this.handler._controller.instance.render
            || this.handler._controller.original.render || {};

          Object.keys(_partials).forEach(_target => {
            const _locals = {};

            Object.keys(_partials[_target].data).forEach(key => {
              try {
                _locals[key] = _partials[_target].data[key](this);
              } catch (e) {
                e.debug = {
                  summary: `Partial '${_target}.${key}' failed`,
                  message: e.message,
                  stack: e.stack,
                };

                throw e;
              }
            });

            _views.push({
              src: _partials[_target].src || _target,
              data: _locals,
              block: _target.split('/').pop(),
            });
          });
        }

        const _chunks = _views.splice(0, _views.length);

        // connection details
        this.merge_locals({
          env: this.env,
          pid: this.pid,
          host: this.host,
          port: this.port,
          method: this.method,
          params: this.params,
          handler: this.handler,
          remote_ip: this.remote_ip,
          path_info: this.path_info,
          script_name: this.script_name,
          request_path: this.request_path,
          query_string: this.query_string,
          query_params: this.query_params,
        });

        return Promise.all(_chunks.map(chunk => _render(chunk, $.util, this.resp_locals)))
          .then(results => {
            const _blocks = {};

            _chunks.forEach(_chunk => {
              /* istanbul ignore else */
              if (_blocks[_chunk.block] && !Array.isArray(_blocks[_chunk.block])) {
                _blocks[_chunk.block] = [_blocks[_chunk.block]];
              }

              if (Array.isArray(_blocks[_chunk.block])) {
                _blocks[_chunk.block].push(results.shift());
              } else {
                _blocks[_chunk.block] = results.shift();
              }
            });

            return _view(this, _blocks);
          })
          .catch(err => errorHandler(err, this));
      },
      props: {
        layout: $.extensions.layout,
      },
      methods: {
        view(src, locals) {
          /* istanbul ignore else */
          if (typeof src === 'object') {
            locals = src;
            src = locals.src;
          }

          const _locals = locals || {};
          const _target = _locals.as || 'yield';

          _views.push({
            src: src || 'index',
            data: _locals,
            block: _target,
          });

          return this;
        },
        render(src, locals) {
          return $.extensions.render(src, $.util.extend({}, locals || {}, this.resp_locals))
            .catch(err => errorHandler(err, this));
        },
      },
    });

    $.on('repl', (repl, logger) => {
      repl.defineCommand('render', {
        help: 'Display any view or layout',
        action(value) {
          const _args = wargs(value, v => {
            // allow dynamic value interpolation
            try {
              return v.replace(reInterpolate, ($0, $1) => vm.runInNewContext($1, repl.context));
            } catch (e) {
              throw new Error(`Invalid expression within '${v}'. ${e.message}`);
            }
          });

          const _partial = _args._.shift();

          if (!_partial) {
            logger.fail('Missing view path');
            return;
          }

          try {
            $.extensions.render(_partial, $.util.extend({}, _args.data, _args.params))
              .then(logger.log)
              .catch(logger.fail);
          } catch (e) {
            logger.fail(e.message);
          }
        },
      });
    });
  };
};
