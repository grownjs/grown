module.exports = function (context, container) {
  context.mount = function (callback) {
    if (callback.dispatch) {
      container.pipeline.push({
        name: callback.name || 'object',
        call: callback.dispatch
      });
    } else if (callback.prototype.dispatch) {
      var Dispatcher = callback;
      var dispatcher = new Dispatcher(container.options);

      container.pipeline.push({
        name: callback.name || 'class',
        call: dispatcher.dispatch.bind(dispatcher)
      });
    } else {
      if (callback.length === 4 || callback.length === 3) {
        throw new Error('middleware `' + callback + '` not supported');
      }

      container.pipeline.push({
        name: callback.name || 'anonymous',
        call: callback
      });
    }

    return context;
  };
};
