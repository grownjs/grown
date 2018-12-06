'use strict';

module.exports = (Grown, util) => {
  return Grown('GRPC.Controllers', {
    scan(cwd, hooks) {
      hooks = hooks || {};

      return util.scanDir(cwd, 'Controller', cb => {
        const Ctrl = cb(Grown, util);

        Ctrl.extensions.forEach(ext => {
          if (ext.methods) {
            Object.keys(ext.methods).forEach(key => {
              if (key.charAt() !== '_') {
                const callback = ext.methods[key];

                // return a promise by default
                ext.methods[key] = function $proxy(ctx, reply) {
                  if (!ctx || typeof reply !== 'function') {
                    throw new Error(`${Ctrl.name}#${key}: Illegal arguments`);
                  }

                  // overload given context
                  ctx.controller = Ctrl.name;
                  ctx.method = key;

                  return Promise.resolve()
                    .then(() => typeof hooks.before === 'function' && hooks.before(ctx))
                    .then(() => callback.call(this, ctx))
                    .then(data => {
                      try {
                        if (typeof hooks.after === 'function') {
                          hooks.after(ctx, data);
                        }
                      } catch (_e) {
                        // do nothing
                      }

                      reply(null, data);
                    })
                    .catch(e => {
                      try {
                        if (typeof hooks.formatError === 'function') {
                          e = hooks.formatError(e, ctx) || e;
                        }
                      } catch (_e) {
                        // do nothing
                      }

                      reply(e);
                    });
                };
              }
            });
          }
        });

        return Ctrl;
      });
    },
  });
};
