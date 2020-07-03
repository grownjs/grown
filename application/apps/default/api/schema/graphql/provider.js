module.exports = {
  useAuth() {
    return this.Session.Auth.effect(token => {
      return this.Services.API.Session.checkToken({ params: { token } });
    }, {
      input: (req, data, definition) => {
        const [name, id] = definition.split('.');

        return this.Models.get(name).getSchema(id).validate(data.input);
      },
    });
  },
  getAPI() {
    return this.Services.API;
  },
};
