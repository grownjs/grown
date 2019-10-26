import {
  takeSnapshot, useSelectors, useFixtures, getVal, getEl, $,
} from 'bdd-tc';

import config from '../config';
import * as data from '../fixtures';
import * as elems from '../selectors';

import { getLocation } from '../helpers/client';

let page;

useFixtures(data);
useSelectors(elems);

export default {
  matchers: {
    action: '(?:Then|When)',
    prelude: '(?:Given an initial|Then should I take an|Just take an?)',
  },

  after: {
    snapshot: () => async t => {
      await takeSnapshot(t);
    },
  },

  url(path = '') {
    return config.url + path;
  },

  '$action I click on $selector': selectorName => async t => {
    await t.click(getEl(selectorName));
  },

  '$action I fill $selector with "$value"': (selectorName, innerText) => async t => {
    await t.typeText(getEl(selectorName), getVal(innerText));
  },

  '$prelude snapshot for $snapshot': snapId => async t => {
    await takeSnapshot(t, { as: snapId });
  },

  'Then I should navigate to $pageId': pageId => async t => {
    const { pathname } = await getLocation();

    page = getEl(pageId)

    await t
      .expect(page.url).eql(pathname)
      .expect(page.verify.visible).ok();
  },

  'Then I see "$message"': innerText => async t => {
    await t.expect($('.body').innerText).contains(innerText);
  },
};
