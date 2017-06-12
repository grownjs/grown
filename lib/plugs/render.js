'use strict';

const debug = require('debug')('grown:render');

const _tpl = require('../util/_tpl');

const wargs = require('wargs');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const reInterpolate = /`([^`]+)`/g;

module.exports = args => {
  const _folders = [];
  const _cachedPaths = {};

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading views from %s', path.relative(process.cwd(), cwd));

      _folders.push(cwd);
    });
  });

  function _render(tpl) {
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
          _cachedPaths[_id] = _tpl.find(_id, _folders);
        }
      }

      /* istanbul ignore else */
      if (!_fn && _cachedPaths[_id].indexOf('.js') === -1) {
        return fs.createReadStream(_cachedPaths[_id]);
      }

      return _tpl.run(_fn || require(_cachedPaths[_id]), tpl.data);
    } catch (e) {
      e.summary = `Failed rendering '${_id}' template`;
      throw e;
    }
  }

  return $ => {
    const logger = $.logger.getLogger();

    const _views = [];

    function _view(conn, blocks) {
      let _layout = ((conn.layout !== false ? conn.resp_locals.layout : conn.layout) !== false)
        ? (conn.resp_locals.layout || conn.layout || 'default')
        : '';

      /* istanbul ignore else */
      if (conn.handler && conn.handler._controller && conn.handler._controller.instance) {
        const _current = conn.handler._controller.instance.layout || conn.handler._controller.original.layout;

        _layout = typeof _current !== 'undefined'
          ? _current
          : _layout;
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

      return Promise.resolve()
        .then(() => _render({ src: _layout, data: blocks }))
        .catch(e => {
          blocks.hasError = true;
          blocks.error = e;

          // use built-in layout as fallback
          return Promise.resolve()
            .then(() => _render({ src: 'layouts/error', data: blocks }))
            .catch(() => {
              throw e;
            });
        })
        .then(result => {
          conn.resp_body = result;
        });
    }

    // shortcuts
    $.extensions.layout = '';
    $.extensions.render = (src, locals) =>
      $.util.props(locals || {})
        .then(data => _render({
          src,
          data,
          block: typeof src === 'string' ? src.split('/').pop() : null,
        }));

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
                e.summary = `Failed rendering '${_target}.${key}' partial`;
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

        return Promise.all(_chunks.map(_render))
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
          /* istanbul ignore else */
          if (typeof src === 'object') {
            locals = src;
            src = locals.src;
          }

          src = src || 'index';

          const _locals = locals || {};
          const _target = _locals.as || 'yield';

          return $.util.props(_locals)
            .then(data => _views.push({
              src,
              data,
              block: _target,
            }))
            .then(() => this);
        },
        render(src, locals) {
          return $.extensions.render(src, locals);
        },
      },
    });

    $.on('repl', repl => {
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
            logger.info('{% error Missing view path %}\n');
            return;
          }

          repl.pause();

          try {
            $.extensions.render(_partial, $.util.extend({}, _args.data, _args.params))
              .then(data => logger.info('{% gray %s %}\n', data))
              .catch(e => logger.info('{% error %s %}\n', e.toString()))
              .then(() => {
                repl.resume();
                repl.displayPrompt();
              });
          } catch (e) {
            logger.info('{% error %s %}\n', e.toString());

            repl.resume();
            repl.displayPrompt();
          }
        },
      });
    });
  };
};
