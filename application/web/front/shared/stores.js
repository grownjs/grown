import { writable } from 'svelte/store';

export default writable({
  info: null,
  login: null,
  logout: null,
  loading: false,
  loggedIn: false,
});
