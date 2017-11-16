module.exports = (state, h) =>
  h('html', null,
    h('body', null,
      state.contents));
