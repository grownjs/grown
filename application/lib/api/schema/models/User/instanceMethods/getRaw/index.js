module.exports = function getRaw() {
  const response = {
    id: this.id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role || '',
    verified: this.verified,
  };

  return response;
};
