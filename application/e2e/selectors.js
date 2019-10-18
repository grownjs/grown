import { $ } from 'bdd-tc';

import {
  loginPage,
} from './helpers/pages';

function menuLink(innerText) {
  return $('nav.menu').find('a').withText(innerText);
}

export const login = menuLink('Login');
export const loginEmail = loginPage.body.find('input[type=email]');
export const loginPassword = loginPage.body.find('input[type=password]');
export const loginSubmitButton = loginPage.body.find('button[type=submit]');
