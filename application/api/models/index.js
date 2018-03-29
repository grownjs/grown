'use strict';

module.exports = Grown => {
  Grown.use(require('@grown/model'));

  return Grown('Models', {
    connection: 'sqlite::memory:',
    include: [
      Grown.Model.Repo,
      Grown.Model.Loader.scan(__dirname),
    ],
  });
};
