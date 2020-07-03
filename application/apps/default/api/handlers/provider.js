module.exports = {
  mailer() {
    return this.Services.getMailer();
  },
  getUser() {
    return this.Models.get('User');
  },
  getToken() {
    return this.Models.get('Token');
  },
  getSession() {
    return this.Models.get('Session');
  },
};
