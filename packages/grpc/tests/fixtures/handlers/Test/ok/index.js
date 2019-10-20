module.exports = function wait() {
  return new Promise(next => setTimeout(() => next({ ok: null }), 1100));
};
