module.exports = function (label, pipeline) {
  var _args = Array.prototype.slice.call(arguments, 2);

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
          if (Array.isArray(cb.call)) {
            value = cb.call[0][cb.call[1]].apply(cb.call[0], args.concat(_args));
          } else {
            value = cb.call.apply(null, args.concat(_args));
          }
        } catch (e) {
          return done(e);
        }

        Promise.resolve(value)
          .catch(function (error) {
            done(error);
          })
          .then(function () {
            next(done);
          });
      }
    }

    next(function (error) {
      if (error) {
        throw error;
      }
    });
  };
};
