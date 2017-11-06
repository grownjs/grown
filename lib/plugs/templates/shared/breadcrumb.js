function aLink(href, text, q) {
  return `<a href="${href}${q ? `?${q}` : ''}">${text}</a>`;
}

module.exports = state => {
  if (!state.breadcrumbs || !Array.isArray(state.breadcrumbs) || state.breadcrumbs.length === 0) {
    return '<p>Missing breadcrumbs, verify your state</p>';
  }

  return `<nav role="navigation">${state.breadcrumbs.map(x => {
    if (!(x.href && x.title)) {
      return '<span>Missing href and title, verify your state.</span>';
    }

    return aLink(x.href, x.title, x.query);
  }).join('\n')}</nav>`;
};
