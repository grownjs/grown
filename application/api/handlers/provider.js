module.exports = {
  mailer() { return this.Services.getMailer(); },
  getUser() { return this.Models.getModel('User'); },
  getSession() { return this.Models.getModel('Session'); },
  getToken() { return this.Models.getModel('Token'); },
};
