module.exports = (state, h) =>
  h('p', null, `{ ${Object.keys(state).join(', ')} `);
