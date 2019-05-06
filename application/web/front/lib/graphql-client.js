import FetchQL from 'fetchql';
import { session, state } from '../shared/stores';

export default (url, options) => {
  const client = new FetchQL({
    url,
    onStart(x) { state.set({ loading: x > 0 }); },
    onEnd(x) { state.set({ loading: x > 0 }); },
    ...options,
  });

  const defaults = {};

  function resp(result, callback) {
    const retval = typeof callback === 'function' && callback(result.data);

    // FIXME: seems like set() is actually overriding, not merging
    if (!retval && result.data) {
      session.set(Object.assign(defaults, result.data));
    }

    return retval;
  }

  function query(gql, data, callback) {
    if (typeof data === 'function') {
      callback = data;
      data = undefined;
    }

    return client
      .query({ query: gql, variables: data })
      .then(result => resp(result, callback));
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
