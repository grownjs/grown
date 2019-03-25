import graphqlClient from '../lib/graphql-client';

let session;

try {
  session = JSON.parse(localStorage.getItem('session')) || {};
} catch (e) {
  session = {};
}

const $ = graphqlClient('/api/v1/graphql', {
  headers: {
    Authorization: `Bearer ${session.token}`,
  },
});

export const store = $.store;
export const query = $.query;
export const mutation = $.mutation;
