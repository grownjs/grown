module.exports = {
  inject: {
    syncValue: () => 'OTHER',
  },
  main($) {
    $.resp_body = $.syncValue;
  },
};
