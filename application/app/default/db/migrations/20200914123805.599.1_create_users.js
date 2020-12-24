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
        name: {
          type: dataTypes.STRING,
        },
        picture: {
          type: dataTypes.STRING,
        },
        platform: {
          type: dataTypes.STRING,
        },
        identifier: {
          type: dataTypes.STRING,
        },
        email: {
          type: dataTypes.STRING,
        },
        role: {
          type: dataTypes.ENUM('ADMIN', 'GUEST', 'ROOT', 'USER'),
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
