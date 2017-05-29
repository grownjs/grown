'use strict';

const debug = require('debug')('grown:access');

module.exports = defaults => {
  return $ => {
    console.log(defaults, $);
    debug('OSOM');
  };
};
