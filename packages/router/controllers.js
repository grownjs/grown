'use strict';

module.exports = (Grown, util) => {
  function _drawRoutes(ctx, routes) {
    routes.forEach(route => {
      /* istanbul ignore else */
      if (!route.pipeline) {
        const _handler = route.handler.slice();

        const action = _handler.length > 1 ? _handler.pop() : 'index';
        const controller = _handler.filter(x => /^[A-Z]/.test(x)).join('.');

        /* istanbul ignore else */
        if (route.use && !Array.isArray(route.use)) {
          route.use = util.flattenArgs(route.use);
        }

        // route definition
        route.controller = controller;
        route.action = action;

        if (!this._controllers[controller]) {
          try {
            const _controller = this.controller_lookup
              ? this.controller_lookup.replace('%', controller)
              : `${controller}Controller`;

            const Ctrl = util.getProp(Grown, _controller,
              new Error(`${_controller} is not defined`));

            this._controllers[controller] = {
              instance: typeof Ctrl === 'function' ? new Ctrl() : Ctrl,
              definition: Ctrl,
            };
          } catch (e) {
            throw new Error(`${controller} controller failed\n${e.message}`);
          }
        }

        /* istanbul ignore else */
        if (!this._controllers[controller].instance[action] || typeof this._controllers[controller].instance[action] !== 'function') {
          throw new Error(`Invalid callback for ${route.verb} ${route.path} (${controller}#${action})`);
        }

        route.pipeline = route.pipeline || [];

        /* istanbul ignore else */
        if (typeof this._controllers[controller].definition.pipe === 'function') {
          route.pipeline.unshift({
            call: [this._controllers[controller].definition, 'pipe'],
            name: `${controller}#pipe`,
            type: 'method',
          });
        }

        route.pipeline.push({
          call: [this._controllers[controller].instance, action],
          name: `${controller}#${action}`,
          type: 'method',
        });

        route.Controller = this._controllers[controller].definition;

        delete route.handler;
      }
    });
  }

  return Grown('Router.Controllers', {
    _drawRoutes,
    _controllers: {},

    $before_routes: _drawRoutes,
  });
};
