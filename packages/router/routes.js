'use strict';

module.exports = $ => {
  return $.module('Router.Routes', {
  });
};

/*

app.plug(Router.Routes({
  map(routeMappings) {
    return routeMappings()
      .get('/', 'Example')
  }
}))

console.log(app.router.routes)

*/
