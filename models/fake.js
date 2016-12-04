const jsf = require('json-schema-faker');

function _findAll(model) {
  return () => jsf({
    type: 'array',
    items: model.$schemaDefinition,
  });
}

function _findOne(model) {
  return () => jsf(model.$schemaDefinition);
}

module.exports = (model) => {
  model.fake = () => ({
    findOne: _findOne(model),
    findAll: _findAll(model),
  });

  return model;
};
