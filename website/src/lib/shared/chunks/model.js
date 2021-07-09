/* eslint-disable */

require('sqlite3');

const fs = require('fs');

fs.mkdirSync('./models');
fs.mkdirSync('./models/Test');
fs.writeFileSync('./models/Test/schema.json', `{
  "id": "ExampleModel",
  "type": "object",
  "properties": {
    "value": {
      "type": "string"
    }
  }
}`);

fs.writeFileSync('./models/Test/index.js', `
  module.exports = {
    $schema: require('./schema')
  };
`);

Grown = require('@grown/bud')();
Grown.use(require('@grown/server'));

server = new Grown();
