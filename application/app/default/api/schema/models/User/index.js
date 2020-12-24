module.exports = {
  $schema: require('./schema.json'),
  $uiSchema: {
    password: {
      'ui:hidden': true,
    },
    identifier: {
      'ui:hidden': true,
    },
    picture: {
      'ui:template': [['span', '{@embed:this}']],
      'ui:component': 'FileUpload',
    },
    'ui:append': false,
  },
  $attributes: {
    findAll: ['email', 'name', 'role', 'verified', 'picture', 'platform'],
  },
};
