function aLink(href, text) {
  return `<a href="${href}">${text}</a>`;
}

module.exports = state => {
  function getLinks(handler) {
    if (handler.keypath && typeof state.routes === 'function') {
      return handler.keypath.map(kp => {
        const h = state.routes(kp);

        return aLink(h.path, h.as.split('.').pop());
      }).join('\n');
    }

    if (handler && handler.path !== '/') {
      return aLink(state.request_path, handler.label || handler.as.split('.').pop());
    }
  }

  if (!(state.routes || state.handler)) {
    return;
  }

  return `<p class="breadcrumb">
    ${typeof state.routes === 'function'
      ? aLink(state.routes.root.path, state.routes.root.handler[0])
      : ''}
    ${(state.handler && getLinks(state.handler)) || ''}
  </p>
  `;
};
