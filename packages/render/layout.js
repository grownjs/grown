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

  function onRender(conn, options) {
    const _layout = options.locals.layout || this.template;

    /* istanbul ignore else */
    if (options.locals.layout !== false && (_layout !== options.view)) {
      const markup = (this.render(_layout, util.extendValues({}, options.locals, {
        navigation: this._buildHTML({
          tag: 'nav',
          data: {
            role: 'navigation',
          },
          children: this._slots.navigation
            .reduce((prev, cur, i) => {
              prev.push(cur);

              /* istanbul ignore else */
              if (i !== this._slots.navigation.length - 1) {
                prev.push('<span>/</span>');
              }

              return prev;
            }, []),
        }, 0, options.locals),
        contents: options.contents,
      })) || '').trim();

      options.contents = markup.indexOf('<html') === 0
        ? `<!DOCTYPE html>\n${markup}`
        : markup;

      const before = {
        body: this._renderSlot(this._slots.before.body, options.locals),
        head: this._renderSlot(this._slots.before.head, options.locals),
      };

      const after = {
        body: this._renderSlot(this._slots.after.body, options.locals),
        head: this._renderSlot(this._slots.after.head, options.locals),
      };

      if (options.contents.indexOf('</head>') === -1) {
        options.contents = options.contents.replace('<body', () => `<head>${before.head}${after.head}</head><body`);
      } else {
        options.contents = options.contents.replace(RE_MATCH_HEAD, (_, attrs) => `<head${attrs}>${before.head}`);
        options.contents = options.contents.replace('</head>', () => `${after.head}</head>`);
      }

      options.contents = options.contents.replace(RE_MATCH_BODY, (_, attrs) => `<body${attrs}>${before.body}`);
      options.contents = options.contents.replace('</body>', () => `${after.body}</body>`);
    }
  }

  return $.module('Render.Layout', {
    // render utils
    _renderSlot,
    onRender,

    // default options
    template: '',

    install() {
      console.log('LAYOUT', this.class);

      /* istanbul ignore else */
      if (this.class === 'Grown.Render.Layout' || !this._render) {
        throw new Error('Include this module first');
      }
    },

    mixins() {
      const self = this;

      self._slots = {
        navigation: [],
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
        methods: {
          navigation(text, opts) {
            self._slots.navigation.push({
              tag: 'a',
              data: opts,
              children: [text],
            });

            return this;
          },

          prepend(to, opts) {
            self._slots.before[to].unshift(opts);

            return this;
          },

          append(to, opts) {
            self._slots.after[to].push(opts);

            return this;
          },
        },
      };
    },
  });
};
