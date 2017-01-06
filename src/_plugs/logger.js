/* eslint-disable global-require */

import { extend, methods } from '../_util';

export default (defaults = {}) => {
  const winston = require('winston');

  const transports = [];
  const options = extend({}, defaults);

  delete options.transports;

  if (Array.isArray(defaults.transports)) {
    defaults.transports.forEach((transport) => {
      if (typeof transport === 'string') {
        transports.push(new winston.transports[transport]());
      }

      if (typeof transport === 'object') {
        Object.keys(transport).forEach((key) => {
          transports.push(new winston.transports[key](transport[key]));
        });
      }
    });
  }

  winston.configure(extend(options, { transports }));

  return ($) => {
    $.ctx.mount((conn) => {
      methods(conn, {
        log: () => winston.log,

        // from higher to lower severity
        emerg: () => winston.emerg,
        alert: () => winston.alert,
        crit: () => winston.crit,
        error: () => winston.error,
        warning: () => winston.warning,
        notice: () => winston.notice,
        info: () => winston.info,
        debug: () => winston.debug,
      });
    });
  };
};
