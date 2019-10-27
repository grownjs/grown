import { $ } from 'bdd-tc';
import { loginPage } from './helpers/pages';

export { loginPage } from './helpers/pages';

function menuLink(innerText) {
  return $('nav.menu').find('a').withText(innerText);
}

export const body = $('#app');
export const login = menuLink('Login');
export const loginForm = loginPage.body;
export const loginEmail = loginForm.find('input[type=email]');
export const loginPassword = loginForm.find('input[type=password]');
export const loginSubmitButton = loginForm.find('button[type=submit]');
