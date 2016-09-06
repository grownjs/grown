'use strict';

const server = require('..')();

server.mount(require('morgan')('dev'));

server.listen(5000, (app) => {
  console.log('Listening on', app.location.href);
});
