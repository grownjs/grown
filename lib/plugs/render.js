'use strict';

/* eslint-disable global-require */
/* eslint-disable prefer-rest-params */

const path = require('path');
const fs = require('fs');

const _slice = Array.prototype.slice;

module.exports = function $render() {
  const args = _slice.call(arguments);

  args.forEach((cwd) => {
    /* istanbul ignore else */
    if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
      throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
    }
  });

  const _cachedPaths = {};

  function _lookup(src) {
    for (let i = 0, c = args.length; i < c; i += 1) {
      const _viewsDirectory = path.join(args[i], 'views');
      const file = path.join(_viewsDirectory, `${src}.js`);

      /* istanbul ignore else */
      if (fs.existsSync(file)) {
        return file;
      }
    }

    throw new Error(`Expecting 'src' to be a valid filepath, given '${src}'`);
  }

  function _render(view, resolve) {
    const _id = view.src;

    /* istanbul ignore else */
    if (!_cachedPaths[_id]) {
      _cachedPaths[_id] = _lookup(_id);
    }

    return resolve(view.data)
      .then((locals) => {
        try {
          const _view = require(_cachedPaths[_id]);

          /* istanbul ignore else */
          if (typeof _view !== 'function') {
            throw new Error(`Invalid view function, given '${_view}'`);
          }

          return _view(locals);
        } catch (e) {
          e.debug = {
            summary: `Render '${_id}' failed`,
            data: locals,
          };

          throw e;
        }
      });
  }

  return ($, util) => {
    const _views = [];

    function _append(view, locals) {
      /* istanbul ignore else */
      if (typeof view === 'object') {
        locals = view;
        view = locals.src;
      }

      const _locals = locals || {};
      const _target = _locals.as || 'index';

      _views.push({
        src: view || 'index',
        data: _locals,
        block: _target,
      });
    }

    function _view(conn, blocks) {
      let _layout = 'layouts/default';

      /* istanbul ignore else */
      if (conn.handler && conn.handler._controller && conn.handler._controller.instance) {
        _layout = `layouts/${conn.handler._controller.instance.layout
            || conn.handler._controller.original.layout || 'default'}`;
      }

      // merge with response locals
      util.extend(blocks, conn.resp_locals);

      // merge with connection values
      Object.keys(conn).forEach((key) => {
        /* istanbul ignore else */
        if (typeof blocks[key] === 'undefined' &&
          ((typeof conn[key] !== 'object' && typeof conn[key] !== 'function')
            || Array.isArray(conn[key]))) {
          blocks[key] = conn[key];
        }
      });

      conn.resp_body = require(_lookup(_layout))(blocks);
    }

    $.mount('render', (conn) => {
      conn.before_send(() => {
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
                e.debug = {
                  summary: `Partial '${_target}.${key}' failed`,
                };

                throw e;
              }
            });

            _views.push({
              src: _partials[_target].src || _target,
              data: _locals,
              block: _target.split('/').pop(),
            });
          });
        }

        const _chunks = _views.splice(0, _views.length);

        return Promise.all(_chunks.map(chunk => _render(chunk, util.reduce)))
          .then((results) => {
            const _blocks = {};

            _chunks.forEach((_chunk) => {
              /* istanbul ignore else */
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

      return conn
        // finish response
        .next(() => conn.resp_body === null && conn.end());
    });

    // overload connection
    $.extensions('Homegrown.conn', {
      methods: {
        render: _append,
      },
    });
  };
};
