module.exports = {
  $schema: require('./schema.json'),
  $uiSchema: {
    password: {
      'ui:hidden': true,
    },
    identifier: {
      'ui:hidden': true,
    },
  },
  $attributes: {
    findAll: ['email', 'role', 'verified', 'platform'],
  },
};
