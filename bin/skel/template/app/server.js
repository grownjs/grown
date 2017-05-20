/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */

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
    env: process.env.NODE_ENV || 'development',
  });

  // enable file server
  $.mount(require('serve-static')(path.join(cwd, 'public')));

  // {{#DATABASE}}initialize models before
  $.use(Grown.plugs.models(cwd));

  // {{/DATABASE}}load routes and views
  $.use(Grown.plugs.router({
    middlewares: {
      settings: path.join(cwd, 'config/middlewares.js'),
      folders: path.join(cwd, 'boot/middlewares'),
    },
    settings: path.join(cwd, 'config/routes.js'),
    folders: path.join(cwd, 'app/controllers'),
  }));

  $.use(Grown.plugs.render({
    folders: path.join(cwd, 'build/views'),
  }));

  // required for CSRF
  $.use(Grown.plugs.session({
    secret: process.env.SESSION_SECRET || 'secret*value',
    keys: (process.env.SESSION_KEYS || 'secret*value').split(/\s+/),
    maxAge: parseInt(process.env.SESSION_MAXAGE || 0, 10) || 86400000,
  }));

  // enable file uploads
  $.use(Grown.plugs.formidable({
    multiple: process.env.UPLOAD_MULTIPLE === 'true' || true,
    maxFiles: parseInt(process.env.UPLOAD_MAXFILES, 0) || 10,
  }));

  // inject logging helpers
  $.use(Grown.plugs.logger({
    transports: [{
      Console: {
        chalkize: process.env.LOGGER_COLORIZE === 'true' || true,
      },
    }],
  }));

  return $;
};

// export framework version and teardown
module.exports.version = Grown.version;
module.exports.teardown = cb => Grown.burn(cb);
