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
    // real transport
    function _proxy(delegate) {
      return {
        sendMail(opts, cb) {
          /* istanbul ignore else */
          if (delegate && typeof delegate !== 'function' && typeof delegate !== 'object') {
            throw new Error(`Invalid transport, given: '${delegate}'`);
          }

          if (!delegate) {
            cb(undefined, opts);
          } else {
            delegate(opts, (err, result) => cb(err, result || opts));
          }
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

          // prepare mail locals
          mailerInstance[_call].call(_vars, (to, subject, body) => {
            $.util.extend(_vars, { to, subject, body },
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

    function _send(tpl, locals, _transport) {
      /* istanbul ignore else */
      if (typeof tpl === 'object') {
        locals = $.util.extend({}, tpl, locals);
        tpl = locals.layout || 'default';
      }

      return Promise.resolve()
        .then(() => (typeof tpl === 'string' ? _view(tpl) : locals))
        .then(data => {
          _transport = data.transport || _transport;

          tpl = data.layout || tpl;

          delete data.transport;
          delete data.layout;

          // pass extensions as static context
          return _render({ src: tpl, data }, $.util, $.extensions)
            .then(result => new Promise((resolve, reject) =>
              _proxy(locals.transport || _transport).sendMail({
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
            }));
        });
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
