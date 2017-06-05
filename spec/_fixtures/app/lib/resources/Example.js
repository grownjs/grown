module.exports = {
  User: 'deny',
  Admin: 'allow',
  Editor: $ => $.truth === 42,

  // FIXME: allow more forms... (both below are identical)
  EditorActions: {
    index: $ => $.truth === 42,
    edit: $ => $.truth === 42,
  },

  EditorMultiple: [
    ['index', 'edit', $ => $.truth === 42]
  ],
};
