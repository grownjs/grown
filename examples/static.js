/* eslint-disable global-require */

const Homegrown = require('..')();

const $ = Homegrown.new();

$.extensions('Homegrown.conn.http', process.env.UWS > 0
  ? require('./_uws')
  : () => require('http'));

$.mount(require('serve-index')(__dirname));
$.mount(require('serve-static')(__dirname));

$.listen(5000)
.then((app) => {
  console.log('Listening on', app.location.href);
})
.catch(error => console.log(error.stack));
