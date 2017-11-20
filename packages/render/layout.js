'use strict';

const RE_MATCH_HEAD = /<head([^<>]*)>/;
const RE_MATCH_BODY = /<body([^<>]*)>/;

module.exports = ($, util) => {
  function _renderSlot(opts, state) {
    /* istanbul ignore else */
    if (typeof opts === 'string') {
      return opts;
    }

    /* istanbul ignore else */
    if (typeof opts === 'function') {
      return this._renderSlot(opts(state, this._buildvNode), state);
    }

    /* istanbul ignore else */
    if (Array.isArray(opts)) {
      return opts.map(x => this._renderSlot(x, state)).join('\n');
    }

    /* istanbul ignore else */
    if (opts.tag) {
      return this._buildHTML(opts, 0, state);
    }

    /* istanbul ignore else */
    if (opts.meta) {
      /* istanbul ignore else */
      if (opts.httpEquiv) {
        return this._buildHTML({
          tag: 'meta',
          data: {
            'http-equiv': opts.meta,
            content: opts.content,
          },
        });
      }

      return this._buildHTML({
        tag: 'meta',
        data: {
          name: opts.meta,
          content: opts.content,
        },
      });
    }

    throw new Error(`Unexpected slot, given '${util.inspect(opts)}'`);
  }

  function _onRender(ctx, template) {
    const _layout = template.locals.layout || this.template;

    /* istanbul ignore else */
    if (template.locals.layout !== false && (_layout !== template.view)) {
      const markup = (this.partial(_layout, util.extendValues({}, template.locals, {
        contents: template.contents,
      })) || '').trim();

      template.contents = markup.indexOf('<html') === 0
        ? `<!DOCTYPE html>\n${markup}`
        : markup;

      const before = {
        body: this._renderSlot(ctx.partials.before.body, template.locals),
        head: this._renderSlot(ctx.partials.before.head, template.locals),
      };

      const after = {
        body: this._renderSlot(ctx.partials.after.body, template.locals),
        head: this._renderSlot(ctx.partials.after.head, template.locals),
      };

      if (template.contents.indexOf('</head>') === -1) {
        template.contents = template.contents.replace('<body', () => `<head>${before.head}${after.head}</head><body`);
      } else {
        template.contents = template.contents.replace(RE_MATCH_HEAD, (_, attrs) => `<head${attrs}>${before.head}`);
        template.contents = template.contents.replace('</head>', () => `${after.head}</head>`);
      }

      template.contents = template.contents.replace(RE_MATCH_BODY, (_, attrs) => `<body${attrs}>${before.body}`);
      template.contents = template.contents.replace('</body>', () => `${after.body}</body>`);
    }
  }

  return $.module('Render.Layout', {
    _renderSlot,

    // default options
    template: '',

    // render hooks
    before_render: _onRender,

    install() {
      if (!this._buildvNode) {
        throw new Error('Layout depends on Views, please include within');
      }
    },

    mixins() {
      const _partials = {
        before: {
          head: [],
          body: [],
        },
        after: {
          head: [],
          body: [],
        },
      };

      return {
        props: {
          partials: () => _partials,
        },
        methods: {
          prepend(to, opts) {
            _partials.before[to].unshift(opts);

            return this;
          },

          append(to, opts) {
            _partials.after[to].push(opts);

            return this;
          },
        },
      };
    },
  });
};
