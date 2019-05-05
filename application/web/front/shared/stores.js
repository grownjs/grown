import { writable } from 'svelte/store';

export const session = writable({
  info: null,
  login: null,
  logout: null,
  loggedIn: false,
});

export const state = writable({
  loading: false,
});

export default {
  session,
  state,
};
