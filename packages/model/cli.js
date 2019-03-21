module.exports = Grown => {
  return Grown('Model.CLI', {
    include: [
      require('json-schema-sequelizer/cli'),
    ],
  });
};
