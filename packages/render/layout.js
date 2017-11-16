'use strict';

module.exports = ($, util) => {
  function _write(conn, template) {
    const _layout = template.locals.layout || this.template;

    if (template.locals.layout !== false && (_layout !== template.view)) {
      const markup = (conn.view(_layout, {
        contents: template.contents,
      }) || '').trim();

      template.contents = markup.indexOf('<html') === 0
        ? `<!doctype html>\n${markup}`
        : markup;
    }
  }

  return $.module('Render.Layout', {
    // export heleprs
    _write,

    // default options
    template: '',
  });
};
