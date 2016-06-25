function Middleware(options) {
  console.log('B INIT', options);
}

Middleware.prototype = {
  dispatch: function (conn, options) {
    console.log('B DISPATCH', options);
  }
};

module.exports = Middleware;
