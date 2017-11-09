const smtpTransport = process.env.SMTP_HOST && require('nodemailer').createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = {
  transport: () => {
    if (smtpTransport) {
      return smtpTransport;
    }

    return {
      sendMail(opts, x) {
        opts.test = 42;

        x(null, opts);
      },
    };
  },
  layout: 'default',
  methods: {
    send(mail, locals) {
      mail(locals.email);
    },
  },
};
