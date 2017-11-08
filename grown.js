'use strict';

const debug = require('debug')('grown');

const $new = require('object-new');

const util = require('./lib/util');

const _mount = require('./lib/api/mount_');
const _listen = require('./lib/api/listen_');

const pipelineFactory = require('./lib/util/pipeline');

function $(id, props, extensions) {
  return $new(id, props, $, extensions);
}

// final handler
function done(err, conn) {
  debug('#%s OK. Final handler reached', conn.pid);

  // FIXME: run before_send() here?

  return Promise.resolve()
    .then(() => {
      /* istanbul ignore else */
      if (err) {
        throw err;
      }

      return conn.end();
    })
    .then(() => debug('#%s Finished.', conn.pid))
    .catch(e => conn.end(e));
}

module.exports = $('Grown', opts => {
  /* istanbul ignore else */
  if (!(opts && opts.env && opts.cwd)) {
    throw new Error('Missing environment config');
  }

  function _getConfig(key, defvalue) {
    let value;

    try {
      value = util.get(opts, key, defvalue);
    } catch (e) {
      throw new Error(`Cannot resolve config: ${key}`);
    }

    return typeof value !== 'undefined' ? value : defvalue;
  }

  const scope = {};

  scope._data = {};

  scope._hosts = {};
  scope._servers = {};
  scope._protocols = {};

  scope._extensions = [];
  scope._pipeline = [];

  scope._options = _getConfig;
  scope._invoke = pipelineFactory('^', scope._pipeline, done);

  return $({
    methods: {
      plug(object) {
        const plugins = (!Array.isArray(object) && object)
          ? [object]
          : object;

        plugins.forEach(p => {
          try {
            Object.keys(p).forEach(k => {
              if (k !== 'before_send') {
                $new.readOnlyProperty(this, k, p[k]);
              }
            });
          } catch (e) {
            throw new Error(`${p.name} definition failed. ${e.message}`);
          }

          p.extensions.forEach(x => {
            scope._extensions.push(x);
          });
        });

        return this;
      },

      mount: _mount.bind(scope),

      listen: _listen.bind(scope),
    },
  });
});


$('Grown.version', () => 42, false);

$('Grown.module', (id, def) => $(`Grown.${id}`, def), false);

$('Grown.Router', {
  get(path, cb) {
    console.log(this.mount, path, cb);
  },
  props: {
    routes: {},
  },
});

$('Grown.Conn', {
  props: {
    id: 42,
  },
});
