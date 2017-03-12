/* eslint-disable global-require */

const Grown = require('..');

Grown.new({
  mount: [
    require('morgan')('dev'),
  ],
})
.listen(`${process.env.UWS > 0 ? 'uws' : 'http'}://0.0.0.0:5000`)
.then(app => {
  console.log('Listening on', app.location.href);
})
.catch(error => console.log(error.stack));
