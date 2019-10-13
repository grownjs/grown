module.exports = {
  useEffect() {
    return this.Session.Auth.middleware((token, next) => {
      this.Services.API.Session.checkToken({ params: { token } })
        .then(session => next(null, session))
        .catch(e => next(e, false));
    }, {
      input: (req, data, definition) => {
        return this.Services.getSchema(definition).validate(data.input);
      },
    });
  },
  getAPI() {
    return this.Services.API;
  },
};
