module.exports = {
  useAuth() {
    return this.Session.Auth.effect(token => {
      return this.Services.API.Session.checkToken({ params: { token } });
    }, {
      input: (req, data, definition) => {
        // return this.Services.getSchema(definition).validate(data.input);
      },
    });
  },
  getAPI() {
    return this.Services.API;
  },
};
