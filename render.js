const path = require('path');
const fs = require('fs');

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

    /* eslint-disable global-require */
    return require(_cachedPaths[_id])(view.data);
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
      const _target = _locals.as || 'main';

      delete _locals.as;

      _views.push({
        src: view || 'index',
        data: _locals,
        block: _target,
      });
    };

    container._context.mount((conn) =>
      conn.next(() => {
        const _chunks = _views.splice(0, _views.length);

        /* istanbul ignore else */
        if (_chunks.length) {
          return Promise.all(_chunks.map(_render))
            .then((results) => {
              const _blocks = {};

              _chunks.forEach((_chunk) => {
                _blocks[_chunk.block] = results.shift();
              });

              const src = _lookup('layouts/default');

              conn.body = require(src)(_blocks);
            });
        }
      }));
  };
};
