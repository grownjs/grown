'use strict';

module.exports = ($, util) => {
  return $.module('Render.Layout', {
    // default options
    _slots: {},
    template: '',

    // setup extensions
    install(ctx, options) {
      const self = this;

      $.module('Render.Views', {
        _write(conn, template) {
          const _layout = template.locals.layout || self.template;

          if (template.locals.layout !== false && (_layout !== template.view)) {
            conn.res.write(this.self.render(_layout, {
              contents: template.contents,
            }));
          } else {
            conn.res.write(template.contents);
          }
        },
      });
    },
  });
};
