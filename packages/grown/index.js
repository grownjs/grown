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

  scope._pipeline = [];
  scope._extensions = [];

  scope._events = util.buildPubsub();
  scope._options = util.buildSettings(options);
  scope._callback = util.buildPipeline('^', scope._pipeline, util.doneCallback.bind(scope));

  return {
    name: 'Server',
    init() {
      util.mergeMethodsInto.call(this, this, scope._events);
      this.once('listen', () => this.emit('start'));
    },
    methods: {
      run(context, callback) {
        return Promise.resolve()
          .then(() => this.emit('start'))
          .then(() => {
            const conn = $({
              name: (context || {}).name,
              init: (context || {}).init,
              props: (context || {}).props,
              mixins: (context || {}).mixins,
              methods: (context || {}).methods,
              extensions: scope._extensions.concat((context || {}).extensions || []),
            });

            return scope._callback(conn, scope._options)
              .then(() => typeof callback === 'function' && callback(null, conn))
              .catch(e => typeof callback === 'function' && callback(e, conn))
              .then(() => conn);
          });
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

                case 'extensions':
                case 'mixins':
                  // ignore
                  break;

                case 'call':
                  scope._pipeline.push({
                    name: p.class || p.name || '?',
                    type: 'method',
                    call: [p, k],
                  });
                  break;

                case 'install':
                  p.install(this, scope._options);
                  break;

                default:
                  /* istanbul ignore else */
                  if (k[0] !== k[0].toUpperCase()) {
                    if (this[k]) {
                      util.invokeArgs(this, p, k);
                    } else {
                      util.readOnlyProperty(this, k, p[k], {
                        isMethod: false,
                      });
                    }
                  }
                  break;
              }
            });
          } catch (e) {
            if (p.class || p.name) {
              throw new Error(`${p.class || p.name} definition failed. ${e.stack}`);
            } else {
              throw new Error(`Definition failed, given '{${Object.keys(p).join(', ')}}'. ${e.stack}`);
            }
          }

          /* istanbul ignore else */
          if (p.extensions) {
            p.extensions.forEach(x => {
              /* istanbul ignore else */
              if (x.mixins) {
                scope._extensions.push(x);
              }
            });
          }
        });

        return this;
      },

      mount: _mount.bind(scope),

      listen: _listen.bind(scope),
    },
  };
});

$('Grown.version', () => _pkg.version, false);

$('Grown.module', (id, def) =>
  $(`Grown.${id}`, def), false);

$('Grown.use', cb =>
  cb(Grown, util), false);

module.exports = Grown;
