module.exports = {
  $schema: require('./schema.json'),
  $uiSchema: {
    url: {
      'ui:component': 'FileUpload',
    },
  },
  $attributes: {
    findAll: ['url', 'label'],
  },
};
