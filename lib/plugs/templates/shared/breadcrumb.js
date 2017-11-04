function aLink(href, text, q) {
  return `<a href="${href}${q ? `?${q}` : ''}">${text}</a>`;
}

function map(state, routes, query) {
  return routes.map((kp, i) => {
    const h = state.routes(kp);

    return h && h.path
      ? aLink(h.path, h.as.split('.').pop(), i === routes.length - 1 ? query : null)
      : '';
  });
}

function getLinks(state) {
  if (state.handler.keypath && typeof state.routes === 'function') {
    return map(state, state.handler.keypath, state.query_string)
      .filter(x => x)
      .join('\n<span>/</span>\n');
  }

  if (state.handler.path !== '/') {
    return map(state, state.handler.as.split('.'))
      .concat(state.handler.as.split('.').length > 1
        ? aLink(state.request_path, state.subtitle || state.handler.as.split('.').pop(), state.query_string)
        : undefined)
      .filter(x => x)
      .join('\n<span>/</span>\n');
  }
}

module.exports = state => {
  if (!(state.routes || state.handler)) {
    return;
  }

  const links = (state.handler && getLinks(state)) || '';

  return `<nav role="navigation">
    ${typeof state.routes === 'function'
      ? aLink(state.routes.root.path, state.routes.root.handler[0])
      : ''}
    ${links ? `<span>/</span>\n${links}` : ''}
  </nav>
  `;
};
