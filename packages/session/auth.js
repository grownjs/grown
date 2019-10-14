module.exports = (Grown, util) => {
  function _callback() {
  }

  return Grown('Session.Auth', {
    _callback,

    effect(callback, _middleware) {
      const session = require('./use/session')(this, callback);

      const middleware = this.extensions.reduce((prev, cur) => {
        Object.assign(prev, cur);
        return prev;
      }, {});

      return util.chain(Grown, {
        session,
        ...middleware,
        ..._middleware,
      });
    },
    use(path, types, callback) {
      if (path.charAt() !== '/') {
        throw new Error(`Missing root, given '${path}'`);
      }

      const middleware = Object.keys(types).reduce((prev, cur) => {
        if (types[cur].enabled) {
          try {
            prev[cur] = require(`./passport/${cur}`)(types[cur], callback);
          } catch (e) {
            throw new Error(`Unsupported strategy, given '${cur}'`);
          }
        }

        return prev;
      }, {});

      return (req, res, next) => {
        if (req.url.indexOf(path) !== 0) {
          next();
          return;
        }

        const [baseUri, searchQuery] = req.url.split('?');
        const [, _prefix, type, action] = baseUri.split('/');

        if (!type) {
          next(new Error('Missing authorization'));
          return;
        }

        if (!req.query) {
          req.query = (searchQuery || '')
            .split(/&|&amp;/g)
            .reduce((prev, cur) => {
              const [key, value] = cur.split('=');

              prev[key] = decodeURIComponent(value);

              return prev;
            }, {});
        }

        if (!middleware[type]) {
          next(new Error(`Missing authorization for ${type}`));
          return;
        }

        if (action) {
          middleware[type](req, res, err => {
            if (err) {
              next(err);
              return;
            }

            // FIXME: setup url-back
            res.setHeader('Location', `/?token=${req.user.token || ''}`);
            res.statusCode = 302;
            res.end();
          });
          return;
        }

        try {
          middleware[type](req, res, next);
        } catch (e) {
          next(e);
        }
      };
    },
  });
};
