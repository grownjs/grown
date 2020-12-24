module.exports = function getRaw() {
  const response = {
    id: this.id,
    role: this.role || '',
    email: this.email,
    verified: this.verified,
  };

  return response;
};
