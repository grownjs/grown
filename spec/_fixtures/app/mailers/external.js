module.exports = {
  transport: (opts, x) => {
    opts.test = 42;

    x(null, opts);
  },
  layout: 'default',
  methods: {
    send(mail, locals) {
      mail(locals.email);
    },
  },
};
