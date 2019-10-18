import { $ } from 'bdd-tc';

export const loginPage = {
  url: '/login',
  body: $('form#login'),
  verify: $('h2').withText('Login'),
};
