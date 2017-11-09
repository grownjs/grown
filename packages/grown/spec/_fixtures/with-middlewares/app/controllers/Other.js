module.exports = {
  inject: {
    syncValue: () => 'SYNC',
    asyncValue: () => new Promise(cb => setTimeout(() => cb('ASYNC'), 1000)),
  },
  main($) {
    $.resp_body = [
      $.syncValue,
      $.asyncValue,
    ];
  },
};
