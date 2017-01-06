module.exports = {
  pipeline: {
    err: 'undef',
    test: '_suffix',
  },
  _suffix($) {
    return $.next(() => {
      if ($.resp_body) {
        $.resp_body = `${$.resp_body}!`;
      }
    });
  },
  index($) {
    $.resp_body = 'OSOM';
  },
  test($) {
    return this.index($);
  },
  err() {
  },
};
