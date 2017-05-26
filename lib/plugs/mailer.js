'use strict';

const debug = require('debug')('grown:mailer');

const _tpl = require('../util/_tpl');

const glob = require('glob');
const path = require('path');

module.exports = args => {
  const _folders = [];
  const _handlers = {};
  const _cachedPaths = {};

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading mailer views from %s', cwd);

      _folders.push(cwd);
    });

    // scan handlers
    ((!Array.isArray(opts.handlers) && opts.handlers ? [opts.handlers] : opts.handlers) || []).forEach(cwd => {
      debug('Loading handlers from %s', cwd);

      glob.sync('**/*.js', { cwd, nodir: true }).forEach(src => {
        debug('Registering mailer from %s', path.join(cwd, src));

        _handlers[src.replace(/(?:index)?\.js$/, '').replace(/\//g, '.')] = {
          filepath: path.join(cwd, src),
        };
      });
    });
  });

  function _render(tpl, util, _context) {
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
        .then(locals => {
          /* istanbul ignore else */
          if (!_fn && _cachedPaths[_id].indexOf('.js') === -1) {
            throw new Error(`Cannot use '${_id}' as template`);
          }

          return _tpl.run(_fn || require(_cachedPaths[_id]), locals);
        });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  return $ => {
    // FIXME: implement real proxy/service/delegator
    function _protocol() {
      return {
        sendMail(opts, cb) {
          cb(undefined, opts);
        },
      };
    }

    function _view(tpl) {
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

          const Mailer = $.util.load($.extensions.mailers, _handlers[tpl], tpl);
          const mailerInstance = _handlers[tpl].instance;

          /* istanbul ignore else */
          if (!mailerInstance[_call]) {
            throw new Error(`Missing '${_call}' for ${tpl} mailer`);
          }

          mailerInstance[_call].call(_vars, (to, subject, body) => {
            $.util.extend(_vars, { to, subject, body },
              mailerInstance.defaults,
              Mailer.defaults);

            _sent = true;
          }, $.extensions);
        })
        .then(() => {
          /* istanbul ignore else */
          if (!_sent) {
            throw new Error(`Missing call mail() on '${tpl}.${_call}'`);
          }

          return _vars;
        });
    }

    function _send(tpl, locals) {
      /* istanbul ignore else */
      if (typeof tpl === 'object') {
        locals = $.util.extend({}, tpl, locals);
        tpl = locals.layout || 'default';
      }

      return Promise.resolve()
        .then(() => (typeof tpl === 'string' ? _view(tpl) : locals))
        .then(data =>
          // pass extensions as static context
          _render({ src: tpl, data }, $.util, $.extensions)
            .then(result => new Promise((resolve, reject) =>
              _protocol().sendMail({
                subject: data.subject || locals.subject,
                from: data.from || locals.from,
                to: data.to || locals.to,
                html: result,
              }, (err, info) => {
                if (err) {
                  reject({
                    status: 'error',
                    result: err.message || err.toString(),
                  });
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
            })));
    }

    $.extensions.mailers = $.extensions();

    // static mail sender
    $.extensions.mail = _send;

    $.extensions('Conn', {
      methods: {
        mail: _send,
      },
    });
  };
};
