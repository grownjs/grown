module.exports = ({ bcrypt }) => async function beforeCreate(instance) {
  const hash = await bcrypt.encode(instance.password);

  instance.password = hash;

  return instance;
};
