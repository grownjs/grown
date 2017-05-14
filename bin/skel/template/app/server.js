/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */

const Grown = require('grown');
const path = require('path');

// fresh context
module.exports = cwd => {
  // setup environment
  Grown.env(cwd);

  const $ = new Grown({
    // basedir
    cwd,

    // environment
    env: process.env.NODE_ENV || 'development',

    // other settings
    session: {
      secret: process.env.SESSION_SECRET || 'secret*value',
      keys: (process.env.SESSION_KEYS || 'secret*value').split(/\s+/),
      maxAge: parseInt(process.env.SESSION_MAXAGE || 0, 10) || 86400000,
    },
    upload: {
      multiple: process.env.UPLOAD_MULTIPLE === 'true' || true,
      maxFiles: parseInt(process.env.UPLOAD_MAXFILES, 0) || 10,
    },
    logger: {
      chalkize: process.env.LOGGER_COLORIZE === 'true' || true,
    },
  });

  // enable file server
  $.mount(require('serve-static')(path.join(cwd, 'public')));

  // {{#DATABASE}}initialize models before
  $.use(Grown.plugs.models(cwd));

  // {{/DATABASE}}load routes and views
  $.use(Grown.plugs.router(cwd));
  $.use(Grown.plugs.render(cwd));

  // required for CSRF
  $.use(Grown.plugs.session($.get('session')));

  // enable file uploads
  $.use(Grown.plugs.upload($.get('upload')));

  // inject logging helpers
  $.use(Grown.plugs.logger({
    transports: [{
      Console: {
        chalkize: $.get('logger.chalkize'),
      },
    }],
  }));

  return $;
};

// export framework version and teardown
module.exports.version = Grown.version;
module.exports.teardown = cb => Grown.burn(cb);
