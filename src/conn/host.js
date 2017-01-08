const connFactory = require('./ctx');

const statusCodes = require('http').STATUS_CODES;

// html-safe values
function _encode(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// normalize error object
function _fixError(e) {
  const _stack = (e.stack || '').replace(/.*Error:.+?\n/, '');
  const _error = [e.message || e.toString()];
  const _lines = _error[0].split('\n');

  /* istanbul ignore else */
  if (e.parent) {
    _error.push(e.parent.message || e.parent.toString());
  }

  /* istanbul ignore else */
  if (_stack) {
    _error.push(_stack.split(_lines[_lines.length - 1])[1] || _stack);
  }

  const cwd = process.cwd();

  const lines = _error.map((_msg) => {
    while (_msg.indexOf(cwd) > -1) {
      _msg = _msg.replace(cwd, '.');
    }

    return _msg;
  });

  return {
    stack: lines.pop(),
    body: lines,
    name: e.name || 'Error',
    code: e.statusCode || 500,
    call: `∴ ${e.pipeline.join(' → ')}`,
  };
}

module.exports = ($, protocol) => {
  return (req, res, next) => {
    // normalize
    const host = req.headers.host ? req.headers.host : '';
    const port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    const hostname = port ? host : `${host}:${protocol.globalAgent.defaultPort}`;

    // proxy next() callback
    function _next(e) {
      if (typeof next === 'function') {
        next(e);
      }

      if (!next && e) {
        throw e;
      }
    }

    // error handler
    function fail(e) {
      e.pipeline = e.pipeline || ['host'];

      /* istanbul ignore else */
      if (res.finished) {
        _next(e);
        return;
      }

      e = _fixError(e);

      // normalize response
      res.statusCode = e.code;
      res.statusMessage = statusCodes[e.code];

      return e;
    }

    // lookup opened connection
    const _server = $.hosts[hostname]
      || $.hosts[`${hostname}:${port}`]
      || $.hosts[`0.0.0.0:${port}`];

    /* istanbul ignore else */
    if (_server) {
      const conn = connFactory($, _server, req, res);

      try {
        $.ctx.dispatch(conn, $.opts)
          .catch((err) => {
            const _err = fail(err);

            let _type;
            let _msg;

            switch (conn.accept.type('html', 'json')) {
              case 'html':
                _type = 'text/html';
                _msg = [
                  `<h3>${_err.name}<code>${_err.call}</code></h3><details>`,
                  `<summary>${_encode(_err.body.shift())}</summary><pre>`,
                  _err.body.length ? `- ${_err.body.join('\n- ')}\n` : '',
                  `${_encode(_err.stack)}</pre></details>`,
                ].join('');
                break;

              case 'json':
                _type = 'application/json';
                _msg = JSON.stringify({
                  status: 'error',
                  message: _err,
                });
                break;

              default:
                _type = 'text/plain';
                _msg = `${_err.name} ${_err.call}\n- ${_err.body.join('\n- ')}\n${_err.stack}`;
                break;
            }

            res.writeHead(res.statusCode, {
              'Content-Type': _type,
            });

            res.write(_msg);
            res.end();
          })
          .then(() => _next());
      } catch (e) {
        fail(e, conn);
      }
    }
  };
};
