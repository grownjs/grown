'use strict';

const debug = require('debug')('grown:container');

const path = require('path');

function set(key, value, params) {
  /* istanbul ignore else */
  if ((typeof key !== 'string' || !key) || (typeof value === 'undefined' || value === null)) {
    throw new Error('Cannot store empty key/values');
  }

  params = params || {};

  const object = {
    value,
    params: params.defaults || {},
    factory: typeof params.factory === 'function' ? params.factory : null,
    singleton: typeof params.singleton === 'boolean' ? params.singleton : false,
    instanceable: typeof params.instanceable === 'boolean' ? params.instanceable : false,
  };

  object.callable = (Object.prototype.toString.call(value) === '[object Function]')
    && !(object.instanceable || object.singleton);

  this[key] = object;
}

function get(key) {
  const args = Array.prototype.slice.call(arguments, 1);
  const object = this[key];

  debug('Locating <%s>', key);

  /* istanbul ignore else */
  if (typeof object === 'undefined') {
    debug('Wait. Value <%s> not found', key);

    return null;
  }

  /* istanbul ignore else */
  if (object.callable) {
    debug('Found callable <%s>', key);

    return object.value.apply(null, args);
  }

  /* istanbul ignore else */
  if (object.instance) {
    debug('Found instantiated <%s>', key);

    return object.instance;
  }

  const params = {};

  Object.keys(object.params).forEach(k => {
    params[k] = object.params[k];
  });

  /* istanbul ignore else */
  if (object.instanceable) {
    debug('Value <%s> is instanceable', key);

    args.forEach(arg => {
      if (Object.prototype.toString.call(arg) === '[object Object]') {
        Object.keys(arg).forEach(k => {
          params[k] = arg[k];
        });
      }
    });

    const $instance = typeof object.factory === 'function'
      ? object.factory(object.value, params)
      : object.value;

    /* istanbul ignore else */
    if (object.singleton) {
      debug('Saving <%s> as singleton', key);

      object.instance = $instance;
    }

    return $instance;
  }

  debug('Value <%s> resolved', key);

  return object.value;
}

module.exports = args => {
  const container = Object.create(null);

  const _tasks = [];

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading services from %s', path.relative(process.cwd(), cwd));

      _tasks.push(require(cwd));
    });
  });

  return $ => {
    const _deps = [];

    _tasks.forEach(opts => {
      opts = typeof opts === 'function' ? opts($) : opts;

      Array.prototype.push.apply(_deps, (!Array.isArray(opts) && opts ? [opts] : opts) || []);
    });

    // expose the container staticly
    $.extensions.locate = key => get.call(container, key);
    $.extensions.services = {};

    // expose container inside the connection
    $.extensions('Conn', {
      methods: {
        locate: $.extensions.locate,
      },
    });

    $.on('start', () => {
      const _count = Object.keys(_deps).length;

      debug('Registering %s service%s', _count, _count === 1 ? '' : 's');

      _deps.forEach(dep => {
        Object.defineProperty($.extensions.services, dep.name, {
          configurable: false,
          enumerable: true,
          get() {
            debug('Starting up <%s>', dep.name);

            return Promise.resolve()
              .then(() => $.extensions.locate(dep.name))
              .then(() => dep.value($))
              .then(result => {
                set.call(container, dep.name, result, dep.params || {});

                return result;
              });
          },
        });
      })
    });
  };
};
