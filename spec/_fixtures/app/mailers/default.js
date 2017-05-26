module.exports = {
  defaults: {
    from: 'admin@example.com',
    other: $ => JSON.stringify($.baz) || 'EMPTY',
  },
  methods: {
    missing() {},
    error() {
      throw new Error('FAIL');
    },
    send(mail, locals) {
      this.foo = locals.bar;

      mail(locals.email, 'OSOMS', ':D');
    },
  },
};
