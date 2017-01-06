module.exports = ($) => {
  return $.next(() => {
    if ($.resp_body) {
      $.resp_body = `${$.resp_body}!`;
    }
  });
};
