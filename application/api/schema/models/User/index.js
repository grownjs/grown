module.exports = {
  $schema: require('./schema.json'),
  $uiSchema: {
    password: {
      'ui:hidden': true,
    },
  },
  $attributes: {
    findAll: ['firstName', 'lastName', 'email', 'role', 'verified'],
  },
};
