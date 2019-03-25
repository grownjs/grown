import FetchQL from 'fetchql';
import { Store } from 'svelte/store';

export default (url, options, defaults) => {
  const store = new Store(defaults);

  const client = new FetchQL({
    url,
    onStart(x) { store.set({ loading: x > 0 }); },
    onEnd(x) { store.set({ loading: x > 0 }); },
    ...options,
  });

  function resp(result) {
    if (result.data) {
      store.set(result.data);
    }
  }

  function query(gql, data, callback) {
    if (typeof data === 'function') {
      callback = data;
      data = undefined;
    }

    return client
      .query({ query: gql, variables: data })
      .then(resp).then(() => typeof callback === 'function' && setTimeout(callback));
  }

  function mutation(gql, cb = done => done()) {
    return function call$(...args) { cb((data, callback) => query(gql, data, callback)).apply(this, args); };
  }

  return {
    client,
    store,
    query,
    mutation,
  };
};
