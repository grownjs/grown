/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const DIST_DIR = process.env.NODE_ENV === 'production'
  ? 'dist'
  : 'build';

const Grown = require('grown');
const path = require('path');

const cwd = process.cwd();

// setup environment
Grown.env(cwd);

// fresh context
module.exports = () => {
  const $ = new Grown({
    // basedir
    cwd,

    // environment
    env: process.env.NODE_ENV,

    // application settings
    paths: {
      publicDir: path.join(DIST_DIR, 'public'),
    },
  });

  // enable file uploads
  $.use(Grown.plugs.formidable({
    multiple: process.env.UPLOAD_MULTIPLE === 'true' || true,
    maxFiles: parseInt(process.env.UPLOAD_MAXFILES, 0) || 10,
  }));

  // required for CSRF
  $.use(Grown.plugs.session({
    secret: process.env.SESSION_SECRET || 'CHANGE_ME',
    keys: (process.env.SESSION_KEYS || 'CHANGE_ME').split(/\s+/),
    maxAge: parseInt(process.env.SESSION_MAXAGE || 0, 10) || 86400000,
  }));

  $.use(Grown.plugs.access({
    settings: path.join(cwd, 'lib/{{paramCase APP_NAME}}_web/policies.js'),
    callback: conn => conn.session.currentUser && conn.session.currentUser.role,
  }));

  // enable file server
  $.use(Grown.plugs.static({
    folders: [
      path.join(cwd, 'public'),
      path.join(cwd, DIST_DIR, 'public'),
    ],
  }));

  // {{#DATABASE}}initialize models before
  $.use(Grown.plugs.models([{
    settings: path.join(cwd, 'config/db/default.js'),
    folders: path.join(cwd, 'lib/{{paramCase APP_NAME}}/models'),
  }]));

  // {{/DATABASE}}load routes and views
  $.use(Grown.plugs.router({
    middlewares: {
      settings: path.join(cwd, 'lib/{{paramCase APP_NAME}}_web/middlewares.js'),
      folders: path.join(cwd, 'lib/{{paramCase APP_NAME}}_web/middlewares'),
    },
    settings: path.join(cwd, 'lib/{{paramCase APP_NAME}}_web/routes.js'),
    folders: path.join(cwd, 'lib/{{paramCase APP_NAME}}_web/controllers'),
  }));

  // rendering support
  $.use(Grown.plugs.render({
    folders: [
      path.join(cwd, 'lib/{{paramCase APP_NAME}}_web/views'),
      path.join(cwd, DIST_DIR, 'templates'),
    ],
  }));

  // built-in mailer support
  $.use(Grown.plugs.mailer({
    settings: path.join(cwd, 'config/mailers.js'),
    folders: [
      path.join(cwd, 'lib/{{paramCase APP_NAME}}_web/views'),
      path.join(cwd, DIST_DIR, 'templates'),
    ],
  }));

  // dependency-injection support
  $.use(Grown.plugs.container({
    folders: path.join(cwd, 'lib/{{paramCase APP_NAME}}/services'),
  }));

  return $;
};

// export framework version and teardown
module.exports.version = Grown.version;
module.exports.teardown = cb => Grown.burn(cb);
