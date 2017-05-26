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
          _cachedPaths[_id] = _tpl.find(_id, _folders);
        }
      }

      return util.props(tpl.data)
        .then(locals => {
          /* istanbul ignore else */
          if (!_fn && _cachedPaths[_id].indexOf('.js') === -1) {
            throw new Error(`Cannot use '${_id}' as template`);
          }

          return _tpl.run(_fn || require(_cachedPaths[_id]), util.extend(Object.create(null), locals, _locals));
        });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  return $ => {
    function _send(tpl, locals) {
      /* istanbul ignore else */
      if (typeof tpl === 'object') {
        locals = tpl;
        tpl = locals.layout || 'default';
      }

      const _call = 'send';

      // check mail
      let _vars = {};
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
            _vars = $.util.extend({ to, subject, body },
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

          return _render({
            src: _tpl.find(`mailers/${tpl}`, _folders),
            data: _vars,
          }, $.util, locals)
          .then(result => {
            console.log('SEND', result);
          });
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
