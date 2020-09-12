const fs = require('fs');
const path = require('path');
const assert = require('assert'); // eslint-disable-line

fs.mkdirSync('./app');
fs.mkdirSync('./app/handlers');
fs.mkdirSync('./app/handlers/Test');
fs.mkdirSync('./app/handlers/Test/Query');
fs.mkdirSync('./app/handlers/Test/Query/truth');

fs.writeFileSync('./app/handlers/Test/Query/truth/index.js', `
  module.exports = function () { return 42; };
`);

fs.writeFileSync('./app/index.gql', `
  type Mutation { noop: Int }
  type Query { truth: Int }
`);

const Grown = require('@grown/bud')();

Grown.use(require('@grown/server'));

const server = new Grown();

server.plug(require('body-parser').json({ limit: '5mb' }));
server.plug(require('body-parser').urlencoded({ extended: false }));

process.nextTick(() => server.listen(8080));

eval(`__dirname='${path.join(process.cwd(), 'app')}';`); // eslint-disable-line
