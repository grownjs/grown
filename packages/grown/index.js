'use strict';

const debug = require('debug')('grown');

const $new = require('object-new');

const _pkg = require('./package.json');

const util = require('./lib/util');
const _mount = require('./lib/mount');
const _listen = require('./lib/listen');

const _protected = ['before_send', 'install', 'call'];

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

            /* istanbul ignore else */
            if (typeof p.before_send === 'function') {
              this.on('before_send', p.before_send);
            }

            /* istanbul ignore else */
            if (typeof p.call === 'function') {
              scope._pipeline.push({
                name: p.class || p.name || '!?',
                call: [p, 'call'],
                type: 'method',
              });
            }

            /* istanbul ignore else */
            if (typeof p.install === 'function') {
              const def = p.install(this, scope._options);

              /* istanbul ignore else */
              if (Object.prototype.toString.call(def) === '[object Object]') {
                util.mergeDefinitionsInto.call(p, this, def, p.class || p.name || '!?');
              }

              return;
            }

            Object.keys(p).forEach(k => {
              /* istanbul ignore else */
              if (_protected.indexOf(k) > -1) {
                return;
              }

              /* istanbul ignore else */
              if (k[0] !== k[0].toUpperCase()) {
                /* istanbul ignore else */
                if (!this[k]) {
                  throw new Error(`Unexpected call to ${k}, given '${util.inspect(p[k])}'`);
                }

                util.invokeArgs(this, p, k);
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
