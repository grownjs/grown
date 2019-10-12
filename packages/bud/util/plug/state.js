function wrap(value) {
  /* istanbul ignore else */
  if (typeof value !== 'function') {
    return () => value;
  }
  return value;
}

function sync(node, cb) {
  node.value = node.resolve();

  for (let i = 0; i < node.children.length; i += 1) {
    sync(node.children[i], cb);
  }
  cb();
}

module.exports = onError => {
  const effects = [];

  let lock = false;
  let deps = [];
  let t;

  const update = () => {
    /* istanbul ignore else */
    if (t || !effects.length) return;
    t = true;

    process.nextTick(() => {
      t = false;

      try {
        effects.forEach(cb => cb());
      } catch (e) {
        if (typeof onError === 'function') {
          onError(e);
        } else {
          throw e;
        }
      }
    });
  };

  const def = resolver => {
    function node(newValue) {
      /* istanbul ignore else */
      if (lock && deps.indexOf(node) === -1) {
        deps.push(node);
      }

      /* istanbul ignore else */
      if (typeof newValue !== 'undefined') {
        node.resolve = wrap(newValue);
        sync(node, update);
      }

      return node.value;
    }

    node.resolve = wrap(resolver);
    node.children = [];

    deps = [];
    lock = true;

    node.resolve();
    lock = false;

    node.dependencies = deps;

    for (let i = 0; i < deps.length; i += 1) {
      deps[i].children.push(node);
    }

    sync(node, update);

    return node;
  };

  def.subscribe = cb => {
    /* istanbul ignore else */
    if (typeof cb !== 'function') {
      throw new Error(`Expecting function to subscribe, given '${cb}'`);
    }

    effects.push(cb);

    return () => {
      effects.splice(effects.indexOf(cb), 1);
    };
  };

  return def;
};
