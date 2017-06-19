module.exports = {
  $schema: {
    properties: {
      id: {
        type: 'integer',
        primaryKey: true,
      },
      value: {
        type: 'string',
      },
    },
    required: [
      'value',
    ],
  },
};
