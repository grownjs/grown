'use strict';

const USAGE_INFO = `

Manage your snapshots

--db      Optional. Database to be used, identifier
--use     Optional. Entry file exporting models
--only    Optional. Filter out specific models

--import  Optional. Load into the database, directory or file
--export  Optional. Save backup to destination, directory

Examples:
  grown backup --load ../from/backup/or/path/to/seeds
  grown backup --save path/to/seeds --only Product,Cart

`;

module.exports = {
  description: USAGE_INFO,
  callback: require('./migrate').callback,
};
