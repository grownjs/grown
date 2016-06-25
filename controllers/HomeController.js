function HomeController() {
  console.log('App Init');
}

HomeController.prototype = {
  foo: function (conn, options) {
    options.x = 'FOO';
  },
  bar: function (conn, options) {
    console.log(options.x);
  },
  index: function (conn) {
    console.log('...');
    conn.res.end('OK!');
  }
};

HomeController.before = {
  index: ['foo']
};

HomeController.after = {
  index: ['bar']
};

module.exports = HomeController;
