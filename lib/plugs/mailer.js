'use strict';

const debug = require('debug')('grown:mailer');

const _tpl = require('../util/_tpl');
const util = require('../util');

const wargs = require('wargs');
const glob = require('glob');
const path = require('path');
const vm = require('vm');

const reInterpolate = /`([^`]+)`/g;

module.exports = args => {
  const _folders = [];
  const _handlers = {};
  const _cachedPaths = {};

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading mailer views from %s', path.relative(process.cwd(), cwd));

      _folders.push(cwd);
    });

    // scan handlers
    ((!Array.isArray(opts.handlers) && opts.handlers ? [opts.handlers] : opts.handlers) || []).forEach(cwd => {
      debug('Loading handlers from %s', path.relative(process.cwd(), cwd));

      glob.sync('**/*.js', { cwd, nodir: true }).forEach(src => {
        debug('Registering mailer from %s', path.relative(process.cwd(), path.join(cwd, src)));

        _handlers[src.replace(/(?:index)?\.js$/, '').replace(/\//g, '.')] = {
          filepath: path.join(cwd, src),
        };
      });
    });
  });

  function _render(tpl, _context) {
    const _id = tpl.src;

    try {
      let _fn;

      if (typeof _id === 'function') {
        debug('Rendering function <%s>', _id.name || '?');

        _fn = _id;
      } else {
        debug('Rendering view <mailers/%s>', _id);

        /* istanbul ignore else */
        if (!_cachedPaths[_id]) {
          _cachedPaths[_id] = _tpl.find(`mailers/${_id}`, _folders);
        }
      }

      return util.props(tpl.data, v => (typeof v === 'function' ? v(_context || {}) : v))
        .then(state => {
          /* istanbul ignore else */
          if (!_fn && _cachedPaths[_id].indexOf('.js') === -1) {
            throw new Error(`Cannot use '${_id}' as template`);
          }

          return _tpl.run(_fn || require(_cachedPaths[_id]), state);
        });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  return $ => {
    const _mailers = $.extensions('Conn._.mailers', false);

    // real transport
    function _proxy(delegate, _context) {
      /* istanbul ignore else */
      if (delegate && typeof delegate !== 'function') {
        throw new Error(`Invalid transport, given: '${delegate}'`);
      }

      /* istanbul ignore else */
      if (typeof delegate === 'function') {
        return delegate(_context);
      }

      // fallback
      return {
        sendMail(opts, cb) {
          cb(undefined, opts);
        },
      };
    }

    function _view(tpl, _context) {
      const _call = 'send';
      const _vars = {};

      // check mail
      let _sent;

      return Promise.resolve()
        .then(() => {
          /* istanbul ignore else */
          if (!_handlers[tpl]) {
            throw new Error(`Missing '${tpl}' mailer`);
          }

          const Mailer = util.ctx.load(_mailers, _handlers[tpl], tpl);
          const mailerInstance = _handlers[tpl].instance;

          /* istanbul ignore else */
          if (!mailerInstance[_call]) {
            throw new Error(`Missing '${_call}' for ${tpl} mailer`);
          }

          // prepare mail state
          mailerInstance[_call].call(_vars, (to, subject, body) => {
            util.extend(_vars, { to, subject, body },
              mailerInstance.defaults,
              Mailer.defaults);

            // set default layout
            _vars.layout = _vars.layout
              || mailerInstance.layout
              || Mailer.layout;

            // set default transport
            _vars.transport = _vars.transpot
              || mailerInstance.transport
              || Mailer.transport;

            _sent = true;
          }, _context);
        })
        .then(() => {
          /* istanbul ignore else */
          if (!_sent) {
            throw new Error(`Missing call mail() on '${tpl}.${_call}'`);
          }

          return _vars;
        });
    }

    function _send(tpl, state, _transport) {
      const _context = $.util.extend({}, $.extensions('Conn._'));

      /* istanbul ignore else */
      if (typeof tpl === 'object') {
        state = util.extend({}, tpl, state);
        tpl = state.layout || 'default';
      }

      return Promise.resolve()
        .then(() => (typeof tpl === 'string' ? _view(tpl, _context) : state))
        .then(_state => {
          _transport = _state.transport || _transport;

          tpl = _state.layout || tpl;

          delete _state.transport;
          delete _state.layout;

          // pass extensions as static context
          return _render({ src: tpl, data: _state }, _context)
            .then(result => new Promise((resolve, reject) =>
              _proxy(state.transport || _transport, _context)
                .sendMail({
                  subject: _state.subject || state.subject,
                  from: _state.from || state.from,
                  to: _state.to || state.to,
                  html: result,
                }, (err, info) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({
                      status: 'sent',
                      result: info,
                    });
                  }
                })))
            .catch(err => ({
              status: 'error',
              result: err.message || err.toString(),
            }));
        });
    }

    // static mail sender
    $.extensions('Conn._', { mailer: _send }, false);

    $.extensions('Conn', {
      methods: {
        mailer: _send,
      },
    });

    $.on('repl', repl => {
      repl.defineCommand('mailer', {
        help: 'Send and preview built-in mailers',
        action(value) {
          const _args = wargs(value, v => {
            // allow dynamic value interpolation
            try {
              return v.replace(reInterpolate, ($0, $1) => vm.runInNewContext($1, repl.context));
            } catch (e) {
              throw new Error(`Invalid expression within '${v}'. ${e.message}`);
            }
          });

          // FIXME: views/mailers/default === views/{path}/{tpl}
          // FIXME: how implement plain text support?
          // FIXME: how to preview and test mailers?

          // FIXME:
          //
          //  .mailer [TO] [SUBJECT] [BODY] [local=value] [foo=bar] [...]
          //    --preview|-p
          //    --mailer|-m
          //    --send|-s -cco|-o --cc|-c
          //    --to|-t --subject|-u --body|-b --attach|-a
          //
          //  .mailer [default] --preview
          //  .mailer pateketrueke@gmail.com "Hello" "WORLD"
          //  .mailer user.activate email=foo@candy.bar code=123 --send
          //  .mailer "my subject" `JSON.stringify(process.env, null, 2)` --mailer external
          //

          console.log(_args);

          repl.displayPrompt();
        },
      });
    });
  };
};
