var path = require('path');
var fs = require('fs');

/* eslint-disable global-require */

module.exports = function (cwd) {
  /* istanbul ignore else */
  if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    throw new Error(("Expecting 'cwd' to be a valid directory, given '" + cwd + "'"));
  }

  var _cachedPaths = {};
  var _viewsDirectory = path.join(cwd, 'views');

  function _lookup(src) {
    var file = path.join(_viewsDirectory, (src + ".js"));

    /* istanbul ignore else */
    if (!fs.existsSync(file)) {
      throw new Error(("Expecting 'src' to be a valid filepath, given '" + src + "'"));
    }

    return file;
  }

  function _render(view) {
    var _id = view.src;

    /* istanbul ignore else */
    if (!_cachedPaths[_id]) {
      _cachedPaths[_id] = _lookup(view.src);
    }

    var locals = {};

    Object.keys(view.data).forEach(function (key) {
      if (typeof view.data[key] !== 'undefined' && view.data[key] !== null) {
        locals[key] = view.data[key];
      }
    });

    var render = function () { return require(_cachedPaths[_id])(locals); };

    function reduce(obj) {
      return Promise.all(Object.keys(obj).map(function (key) { return Promise.resolve(obj[key]).then(function (value) {
          obj[key] = value;
        }); }));
    }

    return reduce(locals).then(render);
  }

  function _fix(obj, locals) {
    if (locals) {
      Object.keys(locals).forEach(function (key) {
        /* istanbul ignore else */
        if (typeof obj[key] === 'undefined') {
          obj[key] = locals[key];
        }
      });
    }
  }

  return function ($) {
    var _views = [];

    $.extensions.render = function (view, locals) {
      /* istanbul ignore else */
      if (typeof view === 'object') {
        locals = view;
        view = locals.src;
      }

      var _copy = {};
      var _locals = locals || {};
      var _target = _locals.as || 'index';

      _fix(_copy, _locals);
      // _fix(_copy, $.extensions);

      _views.push({
        src: view || 'index',
        data: _copy,
        block: _target,
      });
    };

    function _view(conn, start, blocks) {
      var _layout = 'layouts/default';

      /* istanbul ignore else */
      if (conn.handler && conn.handler._controller && conn.handler._controller.instance) {
        _layout = "layouts/" + (conn.handler._controller.instance.layout
            || conn.handler._controller.original.layout || 'default');
      }

      conn.resp_body = require(_lookup(_layout))(blocks)
        .replace(/{elapsed}/g, ((((new Date()) - start) / 1000) + "ms"));
    }

    $.ctx.mount(function (conn) {
      var start = new Date();

      return conn.next(function () {
        /* istanbul ignore else */
        if (conn.handler && conn.handler._controller && conn.handler._controller.instance) {
          var _partials = conn.handler._controller.instance.render
            || conn.handler._controller.original.render || {};

          Object.keys(_partials).forEach(function (_target) {
            var _locals = {};

            Object.keys(_partials[_target].data).forEach(function (key) {
              _locals[key] = _partials[_target].data[key](conn);
            });

            _fix(_locals, $.extensions);

            _views.push({
              src: _partials[_target].src || _target,
              data: _locals,
              block: _target.split('/').pop(),
            });
          });
        }

        var _chunks = _views.splice(0, _views.length);

        /* istanbul ignore else */
        if (!_chunks.length) {
          return;
        }

        return Promise.all(_chunks.map(_render))
          .then(function (results) {
            var _blocks = {};

            _chunks.forEach(function (_chunk) {
              _blocks[_chunk.block] = results.shift();
            });

            _view(conn, start, _blocks);
          });
      });
    });
  };
};
