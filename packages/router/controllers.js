'use strict';

module.exports = (Grown, util) => {
  function _drawRoutes(ctx, routes) {
    routes.forEach(route => {
      /* istanbul ignore else */
      if (!route.pipeline) {
        const _handler = route.handler.slice();

        const action = _handler.length > 1 ? _handler.pop() : 'index';
        const controller = _handler.join('.');

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
              ? this.controller_lookup.replace('%s', controller)
              : `${controller}Controller`;

            const Ctrl = util.getProp(Grown, _controller,
              new Error(`${_controller} is not defined`));

            this._controllers[controller] = {
              instance: new Ctrl(),
              definition: Ctrl,
            };

            /* istanbul ignore else */
            if (!(this._controllers[controller].instance[action])) {
              throw new Error(`No callback found for ${route.verb} ${route.path}`);
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
          } catch (e) {
            throw new Error(`${controller} controller failed\n${e.stack}`);
          }
        }

        delete route.handler;
      }
    });
  }

  return Grown('Router.Controllers', {
    _drawRoutes,
    _controllers: {},

    before_routes: _drawRoutes,
  });
};
