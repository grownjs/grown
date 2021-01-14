const qs = require('querystring');

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
        prev[cur] = ctx => {
          try {
            const is = types[cur].enabled;
            const ok = typeof is === 'function' ? is(ctx) : is;

            if (ok) {
              return require(`./passport/${cur}`)(types[cur], ctx, callback);
            }
          } catch (e) {
            throw new Error(`Failed at loading '${cur}' strategy (${e.message})`);
          }
        };
        return prev;
      }, {});

      return (req, res, next) => {
        if (req.url.indexOf(path) !== 0) {
          next();
          return;
        }

        const [baseUri, searchQuery] = req.url.split('?');
        const [,, type, action] = baseUri.split('/');

        if (!type) {
          next(new Error('Missing authorization'));
          return;
        }

        if (!req.query) {
          req.query = qs.parse(searchQuery || '');
        }

        if (!middleware[type]) {
          next(new Error(`Missing authorization for ${type}`));
          return;
        }

        if (action) {
          middleware[type](req)(req, res, err => {
            if (err) {
              next(err);
              return;
            }

            const prefix = types[type].redirect || '/';
            const param = types[type].parameter || 'token';

            res.setHeader('Location', `${prefix}?${param}=${req.user.token || ''}`);
            res.status(302).end();
          });
          return;
        }

        try {
          middleware[type](req)(req, res, next);
        } catch (e) {
          next(e);
        }
      };
    },
  });
};
