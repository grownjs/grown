function aLink(href, text) {
  return `<a href="${href}">${text}</a>`;
}

function map(state, routes) {
  return routes.map(kp => {
    const h = state.routes(kp);

    return h && h.path
      ? aLink(h.path, h.as.split('.').pop())
      : '';
  });
}

module.exports = state => {
  function getLinks(handler) {
    if (handler.keypath && typeof state.routes === 'function') {
      return map(state, handler.keypath)
        .join('\n');
    }

    if (handler && handler.path !== '/') {
      return map(state, handler.as.split('.'))
        .concat(handler.as.split('.').length > 1
          ? aLink(state.request_path, state.subtitle || handler.label || handler.as.split('.').pop())
          : undefined)
        .join('\n');
    }
  }

  if (!(state.routes || state.handler)) {
    return;
  }

  return `<nav role="navigation">
    ${typeof state.routes === 'function'
      ? aLink(state.routes.root.path, state.routes.root.handler[0])
      : ''}
    ${(state.handler && getLinks(state.handler)) || ''}
  </nav>
  `;
};
