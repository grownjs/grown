import { Selector } from 'testcafe';

export const loginPage = {
  url: '/login',
  body: Selector('form#login'),
  verify: Selector('h2').withText('Login'),
};
