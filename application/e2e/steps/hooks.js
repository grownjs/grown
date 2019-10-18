import { Selector } from 'testcafe';
import { takeSnapshot } from 'bdd-tc';

import config from '../config.js';
import * as pages from '../helpers/pages';
import { getLocation } from '../helpers/client';

function menuLink(innerText) {
  return Selector('nav.menu').find('a').withText(innerText);
}

const els = {
  login: menuLink('Login'),
};

export default {
  matchers: {
    action: '(?:If|When)',
    prelude: '(?:Given an initial|Then should I take an)',
  },

  after: {
    snapshot: () => async t => {
      await takeSnapshot(t);
    },
  },

  url(path = '') {
    return config.url + path;
  },

  '$action I click on @$selector': selectorName => async t => {
    await t.click(els[selectorName] || Selector(selectorName));
  },

  '$prelude snapshot for $snapshot': snapId => async t => {
    await takeSnapshot(t, { as: snapId });
  },

  'Then I should navigate to @$pageId': pageId => async t => {
    if (!pages[pageId]) {
      throw new TypeError(`Page with id '${pageId}' is not defined`);
    }

    const { pathname } = await getLocation();

    await t
      .expect(pages[pageId].url).eql(pathname)
      .expect(pages[pageId].verify.visible).ok();
  },
};
