'use strict';

const debug = require('debug')('grown');

const $new = require('object-new');

const _pkg = require('./package.json');

const util = require('./lib/util');
const _mount = require('./lib/mount');
const _listen = require('./lib/listen');

function $(id, props, extensions) {
  return $new(id, props, $, extensions);
}

const Grown = $('Grown', options => {
  /* istanbul ignore else */
  if (!(options && options.env && options.cwd)) {
    throw new Error('Missing environment config');
  }

  debug('#%s Grown v%s - %s', process.pid, _pkg.version, options.env);

  const scope = {};

  scope._hosts = {};
  scope._servers = {};
  scope._protocols = {};

  scope._extensions = [];
  scope._pipeline = [];

  scope._events = util.buildPubsub();
  scope._options = util.buildSettings(options);
  scope._callback = util.buildPipeline('^', scope._pipeline, util.doneCallback.bind(scope));

  return $({
    init() {
      return {
        methods: {
          on: scope._events.on.bind(this),
          off: scope._events.off.bind(this),
          once: scope._events.once.bind(this),
          emit: scope._events.emit.bind(this),
        },
      };
    },
    methods: {
      run(context, callback) {
        const conn = $({
          init: (context || {}).init,
          props: (context || {}).props,
          methods: (context || {}).methods,
          extensions: scope._extensions.concat((context || {}).extensions || []),
        });

        return scope._callback(conn, scope._options)
          .then(() => typeof callback === 'function' && callback(null, conn))
          .catch(e => typeof callback === 'function' && callback(e, conn))
          .then(() => conn);
      },

      plug() {
        util.flattenArgs(arguments).forEach(p => {
          try {
            if (typeof p === 'function') {
              debug('#%s Install <%s>', process.pid, p.class || p.name);
            } else {
              debug('#%s Install <{ %s }>', process.pid, Object.keys(p).join(', '));
            }

            Object.keys(p).forEach(k => {
              switch (k) {
                case 'before_send':
                  this.on(k, p[k]);
                  break;

                case 'install':
                  p.install(this, scope._options);
                  break;

                default:
                  /* istanbul ignore else */
                  if (k[0] !== k[0].toUpperCase()) {
                    $new.readOnlyProperty(this, k, p[k], {
                      isMethod: false,
                    });
                  }
                  break;
              }
            });
          } catch (e) {
            throw new Error(`${p.name} definition failed. ${e.message}`);
          }

          /* istanbul ignore else */
          if (p.extensions) {
            p.extensions.forEach(x => {
              scope._extensions.push(x);
            });
          }
        });

        return this;
      },

      mount: _mount.bind(scope),

      listen: _listen.bind(scope),
    },
  });
});

$('Grown.version', () => _pkg.version, false);

$('Grown.module', (id, def) =>
  $(`Grown.${id}`, def), false);

$('Grown.use', cb =>
  cb(Grown, util), false);

module.exports = Grown;
