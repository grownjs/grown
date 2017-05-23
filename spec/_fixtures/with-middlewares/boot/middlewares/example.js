module.exports = () => {
  return $ => {
    return $.next(() => {
      if ($.resp_body !== null) {
        $.resp_body = `${$.resp_body}!`;
      }
    });
  };
};
