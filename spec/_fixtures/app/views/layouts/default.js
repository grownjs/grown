module.exports = (locals, h) =>
  h('html', null,
  h('body', null,
    h('p', null, locals.yield)));
