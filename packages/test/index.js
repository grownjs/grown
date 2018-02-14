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
      return done => {
        function end(ex) {
          if (typeof done === 'function') {
            done(ex);
          }

          if (ex) {
            logger.printf('\r\r%s\n', util.cleanError(ex).stack || ex.toString());
          }
        }

        return Promise.resolve()
          .then(() => callback())
          .then(() => end())
          .catch(end);
      };
    },
  });
};
