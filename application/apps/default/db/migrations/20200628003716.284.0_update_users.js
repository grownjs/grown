/* eslint-disable */
'use strict';
module.exports = {
  up: (queryInterface, dataTypes) => [
    () =>
      queryInterface.addColumn('users', 'picture', {
        type: dataTypes.STRING,
      }),
  ],
  down: (queryInterface, dataTypes) => [
    () =>
      queryInterface.removeColumn('users', 'picture'),
  ],
  change: (queryInterface, dataTypes) => [
  ],
};
