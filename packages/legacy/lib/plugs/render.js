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

// FIXME: add ability to try different paths before fail, e.g.
// render/view([a, b, c]) => try a, b or c
// stop on first resolved, fail if no one resolves

function _render(view, cached, folders, fallthrough, environment) {
  const _ids = !Array.isArray(view.src) && view.src
    ? [view.src]
    : view.src;

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
          const _file = _tpl.find(_id, folders,
            !(view.fallthrough || fallthrough)
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
          _render({ src: tpl, data: state || {} }, cached, folders, fallthrough, environment);
      }

      /* istanbul ignore else */
      if (_fn) {
        return _tpl.run(_fn, view.data);
      }

      /* istanbul ignore else */
      if (_id && cached[_id]) {
        /* istanbul ignore else */
        if (cached[_id].file.indexOf('.js') === -1) {
          return fs.createReadStream(cached[_id].file);
        }

        /* istanbul ignore else */
        if (environment === 'development') {
          /* istanbul ignore else */
          if (fs.statSync(cached[_id].file).mtime - cached[_id].mtime) {
            util.clearModules(cached[_id].file);
          }
        }

        return _tpl.run(require(cached[_id].file), view.data);
      }
    } catch (e) {
      e.summary = `Failed rendering '${_ids.join(', ')}' template`;

      throw e;
    }
  }

  // fallback
  return '';
}

function _view($, data, cached, folders, controllers) {
  let _layout = ($.layout !== false)
    ? ($.layout || 'default')
    : '';

  const _controller = (controllers && $.handler.controller)
    ? util.get(controllers, $.handler.controller, null)
    : null;

  /* istanbul ignore else */
  if (_controller && typeof _controller.layout !== 'undefined') {
    _layout = _controller.layout || _layout;
  }

  /* istanbul ignore else */
  if (_layout && typeof _layout === 'string') {
    _layout = `layouts/${_layout}`;
  }

  /* istanbul ignore else */
  if (typeof $.resp_body === 'string') {
    // combine outputs
    data.yield = `${data.yield || ''}${$.resp_body}`;
  }

  /* istanbul ignore else */
  if (!_layout) {
    debug('#%s Done. No layout given', $.pid);

    /* istanbul ignore else */
    if (typeof data.yield !== 'undefined') {
      $.resp_body = data.yield;
    }

    return;
  }

  const result = _render({ src: _layout, data }, cached, folders, false, $.env);

  /* istanbul ignore else */
  if (typeof result !== 'undefined') {
    debug('#%s Done. Layout rendered', $.pid);

    $.resp_body = result;
  }
}

function _partial(view, data) {
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
  _folders.push(path.join(__dirname, 'templates'));

  return $ => {
    const _extensions = $.extensions('Conn._');

    // invoke without extra data
    function render(src, state) {
      return _render(_partial(src, state || {}), _cached, _folders, false, $.env);
    }

    // shortcuts
    $.extensions('Conn._', { render }, false);

    // overload connection
    $.extensions('Conn', {
      identifier: 'do_final_rendering',
      before_send() {
        /* istanbul ignore else */
        if (this.is_json || this.method !== 'GET') {
          return;
        }

        const _controller = (_extensions.controllers && this.handler.controller)
          ? util.get(_extensions.controllers, this.handler.controller, null)
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

            this.slots.templates.unshift(_partial(view));
          });
        }

        debug('#%s Look-up into %s', this.pid, _folders.join(', '));

        return Promise.resolve()
          .then(() => {
            debug('#%s Resolving before_send(%s) chain', this.handler
              ? (this.handler.keypath || [this.handler.controller]).join('.')
              : '?');

            return Promise.all((this.handler ? this.handler.keypath || [] : [])
              .filter(x => x !== (this.handler && this.handler.controller))
              .map(x => util.get(_extensions.controllers, x, null))
              .concat(_controller)
              .filter(x => x && x.before_send)
              .map(x => x.before_send(this)))
              .then(() => {
                this.set_state('breadcrumbs', this.slots.navigation);
              });
          })
          .then(() => {
            debug('#%s Resolving %s template%s',
              this.pid,
              this.slots.templates.length,
              this.slots.templates.length === 1 ? '' : 's');

            // resolve all deferred values
            return Promise.all(this.slots.templates.map(tpl =>
              util.props(tpl.data).then(result => {
                tpl.data = result;
                return tpl;
              })));
          })
          // partial views
          .then(results =>
            results.reduce((prev, cur) => prev.then(() => {
              util.extend(cur.data, this.slots.partials, this.state);

              const result = _render(cur, _cached, _folders, false, $.env);

              /* istanbul ignore else */
              if (!this.slots.partials[cur.block]) {
                this.slots.partials[cur.block] = '';
              }

              this.slots.partials[cur.block] += result;

              return result;
            }), Promise.resolve()))
          // catch-all
          .catch(e => {
            debug('#%s Skip. Error in partials: %s', $.pid, e.message);

            this.resp_body = errorHandler(e, this, !this.is_xhr, $.options);
          })
          // final view
          .then(() =>
            _view(this,
              util.extend({
                slots: this.slots.layout,
              }, this.slots.partials, this.state),
              _cached, _folders, _extensions.controllers));
      },
      init() {
        // fresh state
        return {
          props: {
            slots: {
              navigation: [],
              templates: [],
              partials: {},
              layout: {
                heading: [],
                before: [],
                after: [],
              },
            },
            layout: '',
          },
        };
      },
      props: {
        has_views() {
          return this.slots.templates.length > 0;
        },
      },
      methods: {
        view(src, state) {
          this.slots.templates.push(_partial(src, state || {}));

          return this;
        },
        render(src, state) {
          return _render(_partial(src, util.extend({}, state, this.state)), _cached, _folders, false, $.env);
        },
        navigation_link(opts) {
          this.slots.navigation.push(opts);

          return this;
        },
        append_head(opts) {
          this.slots.layout.heading.push(opts);

          return this;
        },
        before_body(opts) {
          this.slots.layout.before.push(opts);

          return this;
        },
        after_body(opts) {
          this.slots.layout.after.push(opts);

          return this;
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
            const data = render(sub, util.extend({ util: $.util }, _args.data, _args.params));

            logger.info('{% gray %s %}\n', data);
          } catch (e) {
            logger.info('{% error %s %}\n', e.toString());
          } finally {
            repl.resume();
            repl.displayPrompt();
          }
        },
      });
    });
  };
};
