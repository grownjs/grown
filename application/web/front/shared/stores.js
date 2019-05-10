import { writable } from 'svelte/store';

export const session = writable({
  info: null,
  loggedIn: false,
});

export const conn = writable({
  loading: false,
});

export default {
  session,
  conn,
};
