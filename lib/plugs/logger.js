'use strict';

/* eslint-disable global-require */

const debug = require('debug')('grown:logger');

module.exports = function $logger(defaults) {
  const winston = require('winston');

  defaults = defaults || {};

  return ($, util) => {
    const transports = [];
    const options = util.extend({}, defaults);

    delete options.transports;

    /* istanbul ignore else */
    if (Array.isArray(defaults.transports)) {
      defaults.transports.forEach((transport) => {
        /* istanbul ignore else */
        if (typeof transport === 'string') {
          debug('Registering transport %s', transports);

          transports.push(new winston.transports[transport]());
        }

        /* istanbul ignore else */
        if (typeof transport === 'object') {
          Object.keys(transport).forEach((key) => {
            debug('Registering transport %s', key);

            transports.push(new winston.transports[key](transport[key]));
          });
        }
      });
    }

    winston.configure(util.extend(options, { transports }));

    $.extensions('Grown.conn', {
      methods: {
        log: winston.log,
        info: winston.info,
        error: winston.error,
        debug: winston.debug,
      },
    });
  };
};
