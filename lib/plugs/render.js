'use strict';

const debug = require('debug')('grown:render');

const _tpl = require('../util/_tpl');

const wargs = require('wargs');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const reDotSeparator = /\./g;
const reInterpolate = /`([^`]+)`/g;

function _render(view, cached, folders) {
  const _id = view.src;

  try {
    let _fn;

    if (typeof _id === 'function') {
      debug('Rendering function <%s> as %s', _id.name || '?', view.block || '?');

      _fn = _id;
    } else {
      debug('Rendering view <%s> as %s', _id, view.block || '?');

      /* istanbul ignore else */
      if (!cached[_id]) {
        cached[_id] = _tpl.find(_id, folders);
      }
    }

    /* istanbul ignore else */
    if (!_fn && cached[_id].indexOf('.js') === -1) {
      return fs.createReadStream(cached[_id]);
    }

    return _tpl.run(_fn || require(cached[_id]), view.data);
  } catch (e) {
    e.summary = `Failed rendering '${_id}' template`;

    throw e;
  }
}

function _view($, data, cached, folders) {
  let _layout = (($.layout !== false ? $.resp_locals.layout : $.layout) !== false)
    ? ($.resp_locals.layout || $.layout || 'default')
    : '';

  /* istanbul ignore else */
  if ($.handler && $.handler._controller && $.handler._controller.instance) {
    const _current = $.handler._controller.instance.layout || $.handler._controller.original.layout;

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
    debug('#%s Done. No layout given', $.pid);
    return;
  }

  /* istanbul ignore else */
  if (!data.yield) {
    data.yield = $.resp_body;
  }

  return Promise.resolve()
    .then(() => _render({ src: _layout, data }, cached, folders))
    .catch(e => {
      data.hasError = true;
      data.error = e;

      // use built-in layout as fallback
      return Promise.resolve()
        .then(() => _render({ src: 'layouts/error', data }, cached, folders))
        .catch(() => {
          throw e;
        });
    })
    .then(result => {
      $.resp_body = result;
    });
}

module.exports = args => {
  const _folders = [];
  const _cached = {};

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading views from %s', path.relative(process.cwd(), cwd));

      _folders.push(cwd);
    });
  });

  return $ => {
    function _partial(view, locals) {
      let src;

      /* istanbul ignore else */
      if (typeof view !== 'object') {
        view = { src: view, data: locals };
      }

      locals = view.data || locals || {};

      const block = view.as || (typeof view.src === 'string'
        ? view.src.split('/').pop()
        : 'yield');

      return $.util.props(locals)
        .then(data => ({ src: view.src, data, block }));
    }

    const _views = [];

    // shortcuts
    $.extensions.layout = '';
    $.extensions.render = (src, locals) =>
      // invoke without extra data
      Promise.resolve()
        .then(() => _partial(src, locals || {}))
        .then(view => _render(view, _cached, _folders));

    // overload connection
    $.extensions('Conn', {
      before_send() {
        /* istanbul ignore else */
        if (this.handler && this.handler._controller && this.handler._controller.instance) {
          const _partials = this.handler._controller.instance.render
            || this.handler._controller.original.render || {};

          Object.keys(_partials).forEach(_target => {
            const view = $.util.extend({}, typeof _partials[_target] !== 'object'
              ? { src: _partials[_target] }
              : _partials[_target]);

            /* istanbul ignore else */
            if (typeof view.data === 'function') {
              view.data = view.data(this);
            }

            /* istanbul ignore else */
            if (typeof view.src === 'function') {
              view.src = view.src(this);
            }

            /* istanbul ignore else */
            if (!view.src) {
              view.src = `${this.handler.controller.replace(reDotSeparator, '/')}/${_target}`;
            }

            view.as = view.as || _target;
            view.data = view.data || {};

            _views.unshift(_partial(view));
          });
        }

        const _blocks = {};

        return Promise.all(_views.splice(0, _views.length))
          // partial views
          .then(results =>
            results.reduce((prev, cur) => prev.then(() => {
              $.util.extend(cur.data, _blocks, this.resp_locals);

              return Promise.resolve()
                .then(() => _render(cur, _cached, _folders))
                .then(result => {
                  _blocks[cur.block || 'yield'] = result;
                });
            }), Promise.resolve()))
          // final view
          .then(() =>
            _view(this,
              $.util.extend({}, _blocks, this.resp_locals), _cached, _folders));
      },
      props: {
        layout: $.extensions.layout,
      },
      methods: {
        view(src, locals) {
          _views.push(_partial(src, locals || {}));
          return this;
        },
        render(src, locals) {
          return _partial(src, $.util.extend({}, locals, this.resp_locals))
            .then(_view => _render(_view, _cached, _folders));
        },
      },
    });

    $.on('repl', repl => {
      const logger = $.logger.getLogger();

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

          const _view = _args._.shift();

          if (!_view) {
            logger.info('{% error Missing view path %}\n');
            return;
          }

          repl.pause();

          try {
            $.extensions.render(_view, $.util.extend({}, _args.data, _args.params))
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
