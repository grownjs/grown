/* eslint-disable global-require */

const { debugErr, reduce } = require('../util');

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
      _cachedPaths[_id] = _lookup(_id);
    }

    return reduce(view.data)
      .then((locals) => {
        const _view = require(_cachedPaths[_id]);

        /* istanbul ignore else */
        if (typeof _view !== 'function') {
          throw new Error(`Invalid view function, given '${_view}'`);
        }

        return _view(locals);
      });
  }

  function _fix(obj, locals) {
    /* istanbul ignore else */
    if (locals) {
      Object.keys(locals).forEach((key) => {
        /* istanbul ignore else */
        if (typeof obj[key] === 'undefined') {
          obj[key] = locals[key];
        }
      });
    }
  }

  return ($) => {
    const _views = [];

    $.extensions.render = (view, locals) => {
      /* istanbul ignore else */
      if (typeof view === 'object') {
        locals = view;
        view = locals.src;
      }

      const _copy = {};
      const _locals = locals || {};
      const _target = _locals.as || 'index';

      _fix(_copy, $.extensions);
      _fix(_copy, _locals);

      _views.push({
        src: view || 'index',
        data: _copy,
        block: _target,
      });
    };

    function _view(conn, blocks) {
      let _layout = 'layouts/default';

      /* istanbul ignore else */
      if (conn.handler && conn.handler._controller && conn.handler._controller.instance) {
        _layout = `layouts/${conn.handler._controller.instance.layout
            || conn.handler._controller.original.layout || 'default'}`;
      }

      conn.resp_body = require(_lookup(_layout))(blocks);
    }

    $.ctx.mount((conn) => {
      return conn.next(() => {
        /* istanbul ignore else */
        if (conn.handler && conn.handler._controller && conn.handler._controller.instance) {
          const _partials = conn.handler._controller.instance.render
            || conn.handler._controller.original.render || {};

          Object.keys(_partials).forEach((_target) => {
            const _locals = {};

            Object.keys(_partials[_target].data).forEach((key) => {
              try {
                _locals[key] = _partials[_target].data[key](conn);
              } catch (e) {
                const _src = conn.handler._controller.filepath;
                const _msg = `Invalid '${_target}.${key}' inject at ${_src}`;

                throw debugErr(_msg, e);
              }
            });

            _fix(_locals, $.extensions);

            _views.push({
              src: _partials[_target].src || _target,
              data: _locals,
              block: _target.split('/').pop(),
            });
          });
        }

        const _chunks = _views.splice(0, _views.length);

        /* istanbul ignore else */
        if (!_chunks.length) {
          return;
        }

        return Promise.all(_chunks.map(_render))
          .then((results) => {
            const _blocks = {};

            _chunks.forEach((_chunk) => {
              if (_blocks[_chunk.block] && !Array.isArray(_blocks[_chunk.block])) {
                _blocks[_chunk.block] = [_blocks[_chunk.block]];
              }

              if (Array.isArray(_blocks[_chunk.block])) {
                _blocks[_chunk.block].push(results.shift());
              } else {
                _blocks[_chunk.block] = results.shift();
              }
            });

            _view(conn, _blocks);
          });
      });
    });
  };
};
