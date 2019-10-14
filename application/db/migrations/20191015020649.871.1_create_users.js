/* eslint-disable */
'use strict';
module.exports = {
  up: (queryInterface, dataTypes) => [
    () =>
      queryInterface.createTable('users', {
        id: {
          type: dataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        platform: {
          type: dataTypes.STRING,
        },
        identifier: {
          type: dataTypes.STRING,
        },
        firstName: {
          type: dataTypes.STRING,
        },
        lastName: {
          type: dataTypes.STRING,
        },
        email: {
          type: dataTypes.STRING,
        },
        role: {
          type: dataTypes.ENUM('ADMIN', 'GUEST', 'USER'),
        },
        password: {
          type: dataTypes.STRING,
        },
        verified: {
          type: dataTypes.BOOLEAN,
        },
        deletedAt: {
          type: dataTypes.DATE,
        },
        createdAt: {
          type: dataTypes.DATE,
        },
        updatedAt: {
          type: dataTypes.DATE,
        },
      }),
  ],
  down: (queryInterface, dataTypes) => [
    () =>
      queryInterface.dropTable('users'),
  ],
  change: (queryInterface, dataTypes) => [
  ],
};
