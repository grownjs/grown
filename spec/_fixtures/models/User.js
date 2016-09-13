module.exports = (m) => m('users', {
  $schema: {
    id: 'User',
    name: {
      type: 'string',
    },
  },
});
