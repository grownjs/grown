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
    bootable: typeof params.bootable === 'function' ? params.bootable : false,
    singleton: typeof params.singleton === 'boolean' ? params.singleton : true,
    instanceable: typeof params.instanceable === 'boolean' ? params.instanceable : true,
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

    /* istanbul ignore else */
    if (typeof object.value === 'string') {
      object.value = require(object.value);
    }

    const $instance = typeof object.factory === 'function'
      ? object.factory(object.value(), params)
      : object.value();

    /* istanbul ignore else */
    if (object.singleton) {
      debug('Saving <%s> as singleton', key);

      object.instance = $instance;
    }

    return $instance;
  }

  /* istanbul ignore else */
  if (object.callable) {
    debug('Found callable <%s>', key);

    return object.value.apply(null, args);
  }

  debug('Value <%s> resolved', key);

  return object.value();
}

module.exports = args => {
  const _deps = Object.create(null);
  const _tasks = [];

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading services from %s', path.relative(process.cwd(), cwd));

      _tasks.push(require(cwd));
    });
  });

  function locate(key) {
    return Promise.resolve()
      .then(() => get.call(_deps, key));
  }

  return $ => {
    const _init = [];

    _tasks.forEach(opts => {
      opts = typeof opts === 'function' ? opts($) : opts;

      Object.keys(opts).forEach(key => {
        set.call(_deps, key, opts[key].value, opts[key] || {});

        /* istanbul ignore else */
        if (opts[key].bootable) {
          _init.push(key);
        }
      });
    });

    // expose the container staticly
    $.extensions('Conn._', { locate }, false);

    // expose container inside the connection
    $.extensions('Conn', {
      methods: {
        locate,
      },
    });

    $.on('listen', () => {
      // start all bootable services
      _init.forEach(key => {
        get.call(_deps, key);
      });
    });

    $.on('repl', repl => {
      const logger = $.logger.getLogger();

      repl.defineCommand('locate', {
        help: 'Instantiate any registered service',
        action(value) {
          const key = value.split(' ')[0];

          if (!key) {
            logger.info('\r\r{% error Missing service name %}\n');
            repl.displayPrompt();
            return;
          }

          locate(key).then(instance => {
            if (instance === null) {
              throw new Error(`Service '${key}' was not found`);
            }

            logger.info('\r\r{% log %s symbol exported %}\n', key);

            Object.defineProperty(repl.context, key, {
              configurable: false,
              enumerable: true,
              writable: false,
              value: instance,
            });
          })
          .catch(error => {
            logger.info('\r\r{% error %s %}\n', error.message);
          })
          .then(() => repl.displayPrompt());
        },
      });
    });
  };
};
