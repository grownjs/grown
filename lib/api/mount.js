'use strict';

const debug = require('../debug')('grown:mount');

const buildFactory = require('../factory');

module.exports = function $mount(name, _cb) {
  /* istanbul ignore else */
  if (typeof name !== 'string') {
    _cb = name;
    name = null;
  }

  const cb = buildFactory(_cb, this._opts, 'mount');

  /* istanbul ignore else */
  if (name && (cb.name === '?' || cb.name === '*')) {
    cb.name = `${name}${cb.name}`;
  }

  debug('Mounting <%s> handler', cb.name);

  this._connection.push(cb);
};
