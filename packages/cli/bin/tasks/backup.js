'use strict';

const USAGE_INFO = `

  Manage your snapshots

  --models  Entry file exporting models

  --only    Optional. Filter out specific models
  --db      Optional. Database to be used, identifier

  --import  Optional. Load into the database, directory or file
  --export  Optional. Save backup to destination, directory

  Examples:
    grown backup --models path/to/models --load ../from/backup/or/path/to/seeds
    grown backup --models db/models --save path/to/seeds --only Product,Cart

`;

module.exports = {
  description: USAGE_INFO,
  callback: require('./migrate').callback,
};
