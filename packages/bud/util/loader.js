module.exports = async filepath => {
  let mod = await import(filepath);
  mod = mod.__esModule ? mod.default : mod;
  mod = mod.default || mod
  return mod;
};
