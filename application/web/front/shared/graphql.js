import FetchQL from 'fetchql';
import { session, conn } from '../shared/stores';

class GraphQLClient {
  constructor(url, options) {
    const client = new FetchQL({
      url,
      onStart(x) { conn.set({ loading: x > 0 }); },
      onEnd(x) { conn.set({ loading: x > 0 }); },
      ...options,
    });

    function resp(result, callback) {
      const retval = typeof callback === 'function' && callback(result.data);

      if (!retval && result.data) {
        session.update(old => Object.assign(old, result.data));
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
  }
}

let _session;

try {
  _session = JSON.parse(localStorage.getItem('session')) || {};
} catch (e) {
  _session = {};
}

const $ = new GraphQLClient('/api/v1/graphql', {
  headers: {
    Authorization: `Bearer ${_session.token}`,
  },
});

export const query = $.query;
export const mutation = $.mutation;
