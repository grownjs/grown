/* eslint-disable */

const fs = require('fs');
const path = require('path');

fs.mkdirSync('./app');
fs.mkdirSync('./app/views');
fs.mkdirSync('./app/views/Home');
fs.mkdirSync('./app/views/About');
fs.mkdirSync('./app/views/Errors');

fs.writeFileSync('./app/views/default.js', `
  module.exports = (data, h) => h('html', null, h('body', null, data.contents));
`);

fs.writeFileSync('./app/views/Home/index.js', `
  module.exports = (_, h) => h('h1', null, 'It works!');
`);

fs.writeFileSync('./app/views/About/about.js', `
  module.exports = () => '<h1>About...</h1>';
`);

fs.writeFileSync('./app/views/Errors/not_found.js', `
  module.exports = () => '<h1>404</h1>';
`);

Grown = require('@grown/bud')();
Grown.use(require('@grown/server'));

server = new Grown();

process.nextTick(() => server.listen(8080));

eval(`__dirname='${path.join(process.cwd(), 'app')}';`); // eslint-disable-line
