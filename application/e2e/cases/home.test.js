import { $ } from 'bdd-tc';

import config from '../config.js';

/* global fixture, test */

fixture('Home')
  .page(config.url);

test('should start the application', async t => {
  await t.expect($('.body').find('h1').withText('HOME').exists).ok();
});
