'use strict';

module.exports = (Grown, util) => {
  const Request = require('./request')(Grown, util);
  const Mock = require('./mock')(Grown, util);

  Grown.use(require('@grown/logger'));

  const logger = Grown.Logger.getLogger();

  return Grown('Test', {
    include: [
      Request,
      Mock,
    ],

    do(callback) {
      return done =>
        Promise.resolve()
          .then(() => callback())
          .catch(e => {
            logger.printf('\r\r%s\n', util.cleanError(e).stack || e.toString());
          })
          .then(() => typeof done === 'function' && done());
    },
  });
};
