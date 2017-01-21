'use strict';

/* eslint-disable global-require */
/* eslint-disable prefer-rest-params */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const nodePlop = require('node-plop');

const plop = nodePlop(require.resolve('./_plopfile'));
const gen = plop.getGenerator('test');
console.log(plop.getGeneratorList());
console.log(plop.getDestBasePath());

gen.runPrompts().then(gen.runActions)
.then((result) => {
  console.log('>>>', result, gen);
});
