module.exports = {
  mailer() {
    return this.Services.getMailer();
  },
  getUser() {
    return this.Services.getModel('User');
  },
  getToken() {
    return this.Services.getModel('Token');
  },
  getSession() {
    return this.Services.getModel('Session');
  },
};
