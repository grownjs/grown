module.exports = {
  useEffect() {
    return this.Session.Auth.middleware((token, next) => {
      this.Services.API.Session.checkToken({ params: { token } })
        .then(session => next(null, session))
        .catch(e => next(e, false));
    }, {
      input: (data, ref) => {
        return this.Services.getSchema(ref).validate(data.input);
      },
    });
  },
  getAPI() {
    return this.Services.API;
  },
};
