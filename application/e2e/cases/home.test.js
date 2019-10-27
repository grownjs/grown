import { Selector } from 'testcafe';

import config from '../config.js';

fixture('Home')
  .page(config.url);

test('should start the application', async t => {
  await t.expect(Selector('.body').find('h3').withText('Hey, please log in.').exists).ok();
});
