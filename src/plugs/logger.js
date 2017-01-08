/* eslint-disable global-require */

module.exports = (defaults = {}) => {
  const winston = require('winston');

  return ($, { extend }) => {
    const transports = [];
    const options = extend({}, defaults);

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

    winston.configure(extend(options, { transports }));

    $.extensions.log = winston.log;

    // from higher to lower severity
    $.extensions.emerg = winston.emerg;
    $.extensions.alert = winston.alert;
    $.extensions.crit = winston.crit;
    $.extensions.error = winston.error;
    $.extensions.warning = winston.warning;
    $.extensions.notice = winston.notice;
    $.extensions.info = winston.info;
    $.extensions.debug = winston.debug;
  };
};
