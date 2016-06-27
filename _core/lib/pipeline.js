module.exports = function (label, pipeline, _callback) {
  return function (conn, options) {
    var _pipeline = pipeline.slice();

    function next(done) {
      var cb = _pipeline.shift();

      if (!cb) {
        done();
      } else {
        var value;

        try {
          if (conn.res.finished) {
            return done();
          }

          if (Array.isArray(cb.call)) {
            value = cb.call[0][cb.call[1]](conn, options);
          } else {
            value = cb.call(conn, options);
          }
        } catch (e) {
          return done(e);
        }

        if (!value) {
          return next(done);
        }

        if (typeof value.then === 'function' && typeof value.catch === 'function') {
          value
            .then(function () {
              next(done);
            })
            .catch(done);
        } else {
          next(done);
        }
      }
    }

    return new Promise(function (resolve, reject) {
      next(function (err) {
        if (err) {
          err.pipeline = err.pipeline || [];
          err.pipeline.push(label);

          err.data = err.data || [];
        }

        if (_callback) {
          _callback(err, conn, options);
        }

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };
};
