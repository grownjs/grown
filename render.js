const path = require('path');
const fs = require('fs');

/* eslint-disable global-require */

module.exports = (cwd) => {
  /* istanbul ignore else */
  if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
  }

  const _cachedPaths = {};
  const _viewsDirectory = path.join(cwd, 'views');

  function _lookup(src) {
    const file = path.join(_viewsDirectory, `${src}.js`);

    /* istanbul ignore else */
    if (!fs.existsSync(file)) {
      throw new Error(`Expecting 'src' to be a valid filepath, given '${src}'`);
    }

    return file;
  }

  function _render(view) {
    const _id = view.src;

    /* istanbul ignore else */
    if (!_cachedPaths[_id]) {
      _cachedPaths[_id] = _lookup(view.src);
    }

    const locals = {};

    Object.keys(view.data).forEach((key) => {
      if (typeof view.data[key] !== 'undefined' && view.data[key] !== null) {
        locals[key] = view.data[key];
      }
    });

    const render = () => require(_cachedPaths[_id])(locals);

    function reduce(obj) {
      return Promise.all(Object.keys(obj).map((key) =>
        Promise.resolve(obj[key]).then((value) => {
          obj[key] = value;
        })));
    }

    return reduce(locals).then(render);
  }

  return (container) => {
    const _views = [];

    container.extensions.render = (view, locals) => {
      /* istanbul ignore else */
      if (typeof view === 'object') {
        locals = view;
        view = locals.src;
      }

      const _locals = locals || {};
      const _handler = container.extensions.handler || {};
      const _target = _locals.as || _handler.action || 'index';

      delete _locals.as;

      const _copy = {};

      Object.keys(locals).forEach((key) => {
        _copy[key] = _locals[key];
      });

      if (container.extensions) {
        Object.keys(container.extensions).forEach((key) => {
          if (typeof _copy[key] === 'undefined') {
            _copy[key] = container.extensions[key];
          }
        });
      }

      const _path = [_handler.controller, _handler.action].join('/');

      _views.push({
        src: view || _path.replace(/^\//, '') || 'index',
        data: _copy,
        block: _target,
      });
    };

    function _view(conn, blocks) {
      const src = _lookup('layouts/default');

      conn.body = require(src)(blocks);
    }

    container._context.mount((conn) =>
      conn.next(() => {
        if (!(conn.handler._controller && conn.handler._controller.instance)) {
          return;
        }

        const _partials = conn.handler._controller.instance.render || {};

        Object.keys(_partials).forEach((_target) => {
          const _locals = {};

          Object.keys(_partials[_target].data).forEach((key) => {
            _locals[key] = _partials[_target].data[key](conn);
          });

          _views.push({
            src: _partials[_target].src || _target,
            data: _locals,
            block: _target.split('/').pop(),
          });
        });

        const _chunks = _views.splice(0, _views.length);

        /* istanbul ignore else */
        if (!_chunks.length) {
          return;
        }

        return Promise.all(_chunks.map(_render))
          .then((results) => {
            const _blocks = {};

            _chunks.forEach((_chunk) => {
              _blocks[_chunk.block] = results.shift();
            });

            _view(conn, _blocks);
          });
      }));
  };
};
