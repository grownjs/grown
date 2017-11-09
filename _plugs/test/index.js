'use strict';

module.exports = ($, util) => {
  require('./core')($, util);
  require('./mock')($, util);
};
