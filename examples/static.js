/* eslint-disable global-require */

const Homegrown = require('..')();

const $ = Homegrown.new();

$.extensions('Homegrown.support.http', () => require('http'));

$.mount(require('serve-index')(__dirname));
$.mount(require('serve-static')(__dirname));

$.listen(5000, (app) => {
  console.log('Listening on', app.location.href);
});
