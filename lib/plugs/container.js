'use strict';

const debug = require('debug')('grown:container');

const path = require('path');
const fs = require('fs');

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

module.exports = function $container() {
  const args = Array.prototype.slice.call(arguments);

  args.forEach(cwd => {
    /* istanbul ignore else */
    if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
      throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
    }
  });

  const container = Object.create(null);

  return $ => {
    const _deps = [];

    args.unshift(path.join($.get('cwd', process.cwd()), $.get('bootDir', 'boot'), 'services'));

    args.forEach(arg => {
      const x = typeof arg === 'string' ? require(arg) : arg;

      Array.prototype.push.apply(_deps,
        (typeof x === 'function' ? x($) : x) || []);
    });

    // expose the container staticly
    $.extensions.service = key => get.call(container, key);

    // expose container inside the connection
    $.extensions('Conn', {
      methods: {
        service: $.extensions.service,
      },
    });

    $.on('start', () =>
      _deps.reduce((prev, cur) => prev.then(() => {
        debug('Starting up <%s>', cur.name);

        return Promise.resolve(cur.value($))
          .then(result => {
            set.call(container, cur.name, result, cur.params || {});
          });
      }), Promise.resolve()));
  };
};
