/* eslint-disable global-require */

const Homegrown = require('..')();

const $ = Homegrown.new();

$.extensions('Homegrown.support.http', () => require('http'));

$.mount(require('morgan')('dev'));

$.listen(5000, (app) => {
  console.log('Listening on', app.location.href);
}).catch((err) => {
  console.log(err.message);
});
