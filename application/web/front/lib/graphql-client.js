import FetchQL from 'fetchql';
import store from '../shared/stores';

export default (url, options) => {
  const client = new FetchQL({
    url,
    onStart(x) { console.log('store.set({ loading: x > 0 })', x > 0); },
    onEnd(x) { console.log('store.set({ loading: x > 0 })', x > 0); },
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
    query,
    mutation,
  };
};
