module.exports = {
  mailer() { return this.Services.getMailer(); },
  getUser() { return this.Services.getModel('User'); },
  getSession() { return this.Services.getModel('Session'); },
  getToken() { return this.Services.getModel('Token'); },
};
