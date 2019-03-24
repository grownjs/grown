module.exports = (Grown, util) => {
  return Grown('Session.Auth', {
    middleware(callback, _middleware) {
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
  });
};
