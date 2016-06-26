module.exports = function (label, pipeline, callback) {
  var _args = Array.prototype.slice.call(arguments, 3);

  if (typeof callback !== 'function') {
    _args.unshift(callback);
    callback = null;
  }

  return function () {
    var args = Array.prototype.slice.call(arguments);

    var _pipeline = pipeline.slice();

    function next(done) {
      var cb = _pipeline.shift();

      if (!cb) {
        done();
      } else {
        var value;

        try {
          var skip;

          if (callback) {
            skip = callback.apply(null, args.concat(_args));
          }

          if (skip === true) {
            return done();
          }

          if (Array.isArray(cb.call)) {
            value = cb.call[0][cb.call[1]].apply(cb.call[0], args.concat(_args));
          } else {
            value = cb.call.apply(null, args.concat(_args));
          }
        } catch (e) {
          e.label = label;
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
            .catch(function (error) {
              error.label = label;
              done(error);
            });
        } else {
          next(done);
        }
      }
    }

    next(function (error) {
      if (error) {
        error.label = label;
        throw error;
      }
    });
  };
};
