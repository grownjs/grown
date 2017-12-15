'use strict';

module.exports = (Grown, util) => {
  const Controllers = require('./controllers')(Grown, util);
  const Mappings = require('./mappings')(Grown, util);

  return Grown('Router', {
    include: [
      Controllers,
      Mappings,
    ],
  });
};
