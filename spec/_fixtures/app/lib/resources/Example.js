module.exports = {
  User: 'deny',
  Admin: 'allow',
  Editor: [
    ['index', 'edit', $ => $.truth === 42],
    ['destroy', false],
  ],
};
