'use strict';

const debug = require('debug')('grown:render');

const errorHandler = require('../util/error');

const wargs = require('wargs');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const reUppercase = /[A-Z]/;
const reInterpolate = /`([^`]+)`/g;

function h(tag, data) {
  return {
    tag,
    data: data || {},
    children: Array.prototype.slice.call(arguments, 2),
  };
}

function css(style) {
  return Object.keys(style).map(prop =>
    `${prop.replace(reUppercase, '-$&').toLowerCase()}:${style[prop]}`)
  .join(';');
}

function html(vnode) {
  const _attrs = Object.keys(vnode.data).map(key =>
    ` ${key}="${key === 'style' ? css(vnode.data[key]) : vnode.data[key]}"`)
  .join('');

  let _buffer = '';

  vnode.children.forEach(child => {
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

  function _lookup(src) {
    for (let i = 0, c = _folders.length; i < c; i += 1) {
      const file = path.join(_folders[i], `${src}.js`);

      debug('Lookup %s', file);

      /* istanbul ignore else */
      if (fs.existsSync(file)) {
        return file;
      }
    }

    throw new Error(`Expecting 'src' to be a valid filepath, given '${src}'`);
  }

  function _render(tpl, util, _locals) {
    const _id = tpl.src;

    /* istanbul ignore else */
    if (!_cachedPaths[_id]) {
      _cachedPaths[_id] = _lookup(_id);
    }

    return util.reduce(tpl.data)
      .then(locals => {
        try {
          let _tpl = require(_cachedPaths[_id]);

          // FIXME: es6-modules interop?
          _tpl = (_tpl.__esModule && _tpl.default) || _tpl;

          /* istanbul ignore else */
          if (typeof _tpl !== 'function') {
            throw new Error(`Invalid view function, given '${_tpl}'`);
          }

          util.extend(locals, _locals);

          return _tpl.length === 2
            ? html(_tpl(locals, h))
            : _tpl(locals);
        } catch (e) {
          e.debug = {
            summary: `Render '${_id}' failed`,
            message: e.message,
            data: locals,
          };

          throw e;
        }
      });
  }

  return ($, util) => {
    const _views = [];

    function _view(conn, blocks) {
      let _layout = conn.layout !== false ? (conn.layout || 'layouts/default') : '';

      /* istanbul ignore else */
      if (conn.handler && conn.handler._controller && conn.handler._controller.instance) {
        _layout = conn.handler._controller.instance.layout || conn.handler._controller.original.layout;
        _layout = _layout !== false ? `layouts/${_layout || 'default'}` : _layout;
      }

      if (!_layout) {
        debug('Done. No layout given');
        return;
      }

      debug('Rendering view <%s>', _layout);

      // yield previous response body as local
      blocks.yield = conn.resp_body;

      // merge with response locals
      util.extend(blocks, conn.resp_locals);

      debug('Done. Trying to set the response body');

      try {
        let _tpl = require(_lookup(_layout));

        // FIXME: es6-modules interop?
        _tpl = (_tpl.__esModule && _tpl.default) || _tpl;

        /* istanbul ignore else */
        if (typeof _tpl !== 'function') {
          throw new Error(`Invalid layout function, given '${_tpl}'`);
        }

        conn.resp_body = _tpl.length === 2
          ? html(_tpl(blocks, h))
          : _tpl(blocks);

        /* istanbul ignore else */
        if (_tpl.length === 2) {
          // FIXME: prefix DOCTYPE on all JSX responses?
          conn.resp_body = `<!doctype html>${conn.resp_body}`;
        }
      } catch (e) {
        errorHandler(new Error(`Failed to render '${_layout}'. ${e.message}`), conn);
      }
    }

    // shortcut
    $.extensions.layout = '';

    // overload connection
    $.extensions('Conn', {
      before_send() {
        /* istanbul ignore else */
        if (this.handler && this.handler._controller && this.handler._controller.instance) {
          const _partials = this.handler._controller.instance.render
            || this.handler._controller.original.render || {};

          debug('Reducing blocks from <%s.%s> views', this.handler.controller, this.handler.action);

          Object.keys(_partials).forEach(_target => {
            const _locals = {};

            Object.keys(_partials[_target].data).forEach(key => {
              try {
                _locals[key] = _partials[_target].data[key](this);
              } catch (e) {
                e.debug = {
                  summary: `Partial '${_target}.${key}' failed`,
                  message: e.message,
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

        debug('Rendering %s block%s',
          _chunks.length,
          _chunks.length === 1 ? '' : 's');

        // connection details
        this.merge_locals({
          env: this.env,
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

        return Promise.all(_chunks.map(chunk => _render(chunk, util, this.resp_locals)))
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
          });
      },
      props: {
        layout: $.extensions.layout,
      },
      methods: {
        view(src, locals) {
          debug('Appending view <%s>', src);

          /* istanbul ignore else */
          if (typeof src === 'object') {
            locals = src;
            src = locals.src;
          }

          const _locals = locals || {};
          const _target = _locals.as || 'index';

          _views.push({
            src: src || 'index',
            data: _locals,
            block: _target,
          });
        },
        render(src, locals) {
          const data = util.extend({}, locals || {}, this.resp_locals);
          const block = src.split('/').pop();

          debug('Rendering view <%s>', src);

          return _render({ src, data, block }, util, data);
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

          const data = util.extend({}, _args.data, _args.params);

          try {
            _render({ src: _partial, data }, util, data)
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
