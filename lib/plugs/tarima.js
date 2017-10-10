'use strict';

const path = require('path');

module.exports = opts => {
  const options = opts || {};

  return $ => {
    const tarima = require('tarima');
    const vm = require('vm');

    function view(src) {
      const name = `${path.basename(src, '.js')}.js`;

      // use the internal resolution algorithm for imported sources
      const code = `import x from '${src}'; export default x;`;

      return new Promise((resolve, reject) => {
        // prepare the source for bundling, see other extensions
        tarima.parse(name, code, options).bundle((err, output) => {
          if (err) {
            return reject(err);
          }

          const _scope = {
            require,
            global,
            module: {
              exports: {},
            },
          };

          // safely evaluates the bundled source
          vm.runInNewContext(output.source, _scope);

          // merge imported data with exported definitions
          if (typeof _scope.module.exports === 'function') {
            output.data.render = _scope.module.exports;
          } else {
            Object.keys(_scope.module.exports).forEach(key => {
              output.data[key] = _scope.module.exports[key];
            });
          }

          resolve(output.data);
        });
      });
    }

    function render(src) {
      // simply render any given source
      return new Promise((resolve, reject) => {
        tarima.load(src, options).render((err, output) => {
          if (err) {
            return reject(err);
          }

          resolve(output.source);
        });
      });
    }

    function _renderer(src) {
      return /\.\w+$/.test(src)
        ? render(src)
        : view(src);
    }

    // expose as static methods
    $.extensions('Conn._').tarima = _renderer;

    // expose as connection methods
    $.extensions('Conn', {
      methods: {
        tarima: _renderer,
      },
    });
  };
};
