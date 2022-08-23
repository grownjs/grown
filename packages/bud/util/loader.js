module.exports = filepath => {
  return import(filepath).catch(e => {
    throw new Error(`Cannot load ${filepath}\n${e.message}`);
  });
};
