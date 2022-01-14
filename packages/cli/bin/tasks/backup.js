'use strict';

/* istanbul ignore file */

const USAGE_INFO = `

  Load and save database snapshots

  PATH  Entry file exporting models

  --only       Optional. Filter out specific models
  --db         Optional. Database to be used, identifier

  --load       Optional. Load into the database, directory or file
  --save       Optional. Save backup to destination, directory

  Examples:
    {bin} backup path/to/models --load ../from/backup/or/path/to/seeds
    {bin} backup db/models --save path/to/seeds --only Product,Cart

`;

module.exports = {
  description: USAGE_INFO,
  callback: require('./migrate').callback,
};
