'use strict';

/* eslint-disable global-require */

module.exports = (defaults) => {
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
          transports.push(new winston.transports[transport]());
        }

        /* istanbul ignore else */
        if (typeof transport === 'object') {
          Object.keys(transport).forEach((key) => {
            transports.push(new winston.transports[key](transport[key]));
          });
        }
      });
    }

    winston.configure(util.extend(options, { transports }));

    $.ctx.extensions('Homegrown.conn', {
      methods: {
        log: winston.log,
        info: winston.info,
        error: winston.error,
        debug: winston.debug,
      },
    });
  };
};
