'use strict';

const debug = require('debug')('grown:mount');

const buildFactory = require('../util/factory');

module.exports = function $mount(name, handler, callback) {
  /* istanbul ignore else */
  if (typeof name !== 'string') {
    callback = handler;
    handler = name;
    name = null;
  }

  const cb = buildFactory(handler, this._ctx.options, 'mount');

  /* istanbul ignore else */
  if (name && (cb.name === '?' || cb.name === '*')) {
    cb.name = `${name}${cb.name}`;
  }

  /* istanbul ignore else */
  if (typeof callback === 'function') {
    cb.filter = callback;
  }

  debug('Mounting <%s> handler', cb.name);

  this._connection.push(cb);
};
