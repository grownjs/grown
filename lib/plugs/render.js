'use strict';

const debug = require('debug')('grown:render');

const errorHandler = require('../util/error');
const _tpl = require('../util/_tpl');
const util = require('../util');

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
      debug('Rendering function <%s>%s', _id.name || '?', view.block ? ` as ${view.block}` : '');

      _fn = _id;
    } else {
      debug('Rendering view <%s>%s', _id, view.block ? ` as ${view.block}` : '');

      /* istanbul ignore else */
      if (!cached[_id]) {
        cached[_id] = _tpl.find(_id, folders);
      }
    }

    /* istanbul ignore else */
    if (!_fn && cached[_id].indexOf('.js') === -1) {
      return fs.createReadStream(cached[_id]);
    }

    if (!view.data.render) {
      view.data.render = (tpl, locals) =>
        _render({ src: tpl, data: locals || {} }, cached, folders);
    }

    return _tpl.run(_fn || require(cached[_id]), view.data);
  } catch (e) {
    e.summary = `Failed rendering '${_id}' template`;

    throw e;
  }
}

function _view($, data, cached, folders, controllers) {
  let _layout = (($.layout !== false ? $.resp_locals.layout : $.layout) !== false)
    ? ($.resp_locals.layout || $.layout || 'default')
    : '';

  const _controller = (controllers && $.handler.controller)
    ? controllers[$.handler.controller]
    : null;

  /* istanbul ignore else */
  if (_controller && typeof _controller.layout !== 'undefined') {
    _layout = typeof _controller.layout !== 'undefined'
      ? _controller.layout
      : _layout;
  }

  /* istanbul ignore else */
  if (_layout && typeof _layout === 'string') {
    _layout = `layouts/${_layout}`;
  }

  // combine outputs
  data.yield = data.yield || '';

  /* istanbul ignore else */
  if ($.has_body) {
    // response body
    data.yield += $.resp_body;
  }

  /* istanbul ignore else */
  if (!_layout) {
    debug('#%s Done. No layout given', $.pid);
    $.resp_body = data.yield;
    return;
  }

  return Promise.resolve()
    .then(() => _render({ src: _layout, data }, cached, folders))
    .then(result => {
      $.resp_body = result;
    });
}

function _partial(view, locals) {
  /* istanbul ignore else */
  if (typeof view !== 'object') {
    view = { src: view, data: locals };
  }

  locals = view.data || locals || {};

  const block = view.as || locals.as || (typeof view.src === 'string'
    ? view.src.split('/').pop()
    : 'yield');

  return util.props(locals)
    .then(data => ({ src: view.src, data, block }));
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

  // try shared views last
  _folders.push(path.join(__dirname, 'views'));

  // invoke without extra data
  function render(src, locals) {
    return Promise.resolve()
      .then(() => _partial(src, locals || {}))
      .then(view => _render(view, _cached, _folders));
  }

  return $ => {
    const _controllers = $.extensions('Conn._.controllers');

    // shortcuts
    $.extensions('Conn._', { render }, false);

    // overload connection
    $.extensions('Conn', {
      before_send() {
        /* istanbul ignore else */
        if (this.is_json || this.method !== 'GET') {
          return;
        }

        const _controller = (_controllers && this.handler.controller)
          ? _controllers[this.handler.controller]
          : null;

        /* istanbul ignore else */
        if (_controller && _controller.render) {
          Object.keys(_controller.render).forEach(_target => {
            const view = util.extend({}, typeof _controller.render[_target] !== 'object'
              ? { src: _controller.render[_target] }
              : _controller.render[_target]);

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

            this.views.unshift(_partial(view));
          });
        }

        const _blocks = {};

        return Promise.all(this.views)
          // partial views
          .then(results =>
            results.reduce((prev, cur) => prev.then(() => {
              util.extend(cur.data, _blocks, this.resp_locals);

              return Promise.resolve()
                .then(() => _render(cur, _cached, _folders))
                .then(result => {
                  /* istanbul ignore else */
                  if (!_blocks[cur.block]) {
                    _blocks[cur.block] = '';
                  }

                  _blocks[cur.block] += result;
                });
            }), Promise.resolve()))
          // catch-all
          .catch(e => errorHandler(e, this))
          // final view
          .then(() =>
            _view(this,
              util.extend({}, _blocks, this.resp_locals),
              _cached, _folders, _controllers));
      },
      props: {
        views: [],
        layout: '',
        has_views() {
          return this.views.length > 0;
        },
      },
      methods: {
        view(src, locals) {
          this.views.push(_partial(src, locals || {}));
          return this;
        },
        render(src, locals) {
          return _partial(src, util.extend({}, locals, this.resp_locals))
            .then(sub => _render(sub, _cached, _folders));
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

          const sub = _args._.shift();

          if (!sub) {
            logger.info('{% error Missing view path %}\n');
            return;
          }

          repl.pause();

          try {
            render(sub, util.extend({}, _args.data, _args.params))
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
