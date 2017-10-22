'use strict';

const env = process.env.NODE_ENV || 'development';
const cwd = process.cwd();

const Grown = require('grown');
const path = require('path');

// setup environment

Grown.env(cwd);

module.exports = () => {
  const $ = new Grown({ cwd, env });

  // enable file server
  $.use(Grown.plugs.static({
    folders: path.join(cwd, 'public'),
  }));

  // {{#DATABASE}}initialize models before
  $.use(Grown.plugs.models([{
    settings: path.join(cwd, 'database.js'),
    folders: path.join(cwd, 'models'),
  }]));

  // setup the database connection
  $.mount('db', conn => {
    conn.database = '{{paramCase APP_NAME}}';
  });

  // {{/DATABASE}}rendering support
  $.use(Grown.plugs.render({
    folders: [
      path.join(cwd, 'templates'),
    ],
  }));

  // middleware for input parsing
  $.mount(require('body-parser').json({ limit: '5mb' }));
  $.mount(require('body-parser').urlencoded({ extended: false }));

  return $;
};

// export framework version and teardown
module.exports.version = Grown.version;
module.exports.teardown = cb => Grown.burn(cb);
