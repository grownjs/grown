function span(text) {
  return `<span>${text}</span>`;
}

function aLink(href, text) {
  return `<a href="${href}">${text}</a>`;
}

module.exports = locals => {
  function getLinks(handler) {
    if (handler.keypath && typeof locals.routes === 'function') {
      return handler.keypath.map(kp => {
        const h = locals.routes(kp);

        return span('&middot;')
          + aLink(h.path, h.as.split('.').pop());
      }).join('\n');
    }

    if (handler && handler.path !== '/') {
      return span('&middot;') +
        aLink(locals.request_path, handler.as.split('.').pop());
    }
  }

  if (!(locals.routes || locals.handler)) {
    return;
  }

  return `<p class="breadcrumb">
    ${typeof locals.routes === 'function'
      ? aLink(locals.routes.root.path, locals.routes.root.handler[0])
      : ''}
    ${(locals.handler && getLinks(locals.handler)) || ''}
  </p>
  `;
};
