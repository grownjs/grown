'use strict';

const RE_MATCH_HEAD = /<head([^<>]*)>/;
const RE_MATCH_BODY = /<body([^<>]*)>/;

module.exports = ($, util) => {
  function buildSlot(opts, state) {
    /* istanbul ignore else */
    if (typeof opts === 'string') {
      return opts;
    }

    /* istanbul ignore else */
    if (typeof opts === 'function') {
      return this.buildSlot(opts(state, this.buildvNode), state);
    }

    /* istanbul ignore else */
    if (Array.isArray(opts)) {
      return opts.map(x => this.buildSlot(x, state)).join('\n');
    }

    /* istanbul ignore else */
    if (opts.tag) {
      return this.buildHTML(opts, 0, state);
    }

    /* istanbul ignore else */
    if (opts.meta) {
      /* istanbul ignore else */
      if (opts.httpEquiv) {
        return this.buildHTML({
          tag: 'meta',
          data: {
            'http-equiv': opts.meta,
            content: opts.content,
          },
        });
      }

      return this.buildHTML({
        tag: 'meta',
        data: {
          name: opts.meta,
          content: opts.content,
        },
      });
    }

    throw new Error(`Unexpected slot, given '${util.inspect(opts)}'`);
  }

  function _write(conn, template) {
    const _layout = template.locals.layout || this.template;

    /* istanbul ignore else */
    if (template.locals.layout !== false && (_layout !== template.view)) {
      const markup = (conn.view(_layout, util.extendValues({}, template.locals, {
        navigation: this.buildHTML({
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
        }, 0, template.locals),
        contents: template.contents,
      })) || '').trim();

      template.contents = markup.indexOf('<html') === 0
        ? `<!doctype html>\n${markup}`
        : markup;

      const before = {
        body: this.buildSlot(this._slots.before.body, template.locals),
        head: this.buildSlot(this._slots.before.head, template.locals),
      };

      const after = {
        body: this.buildSlot(this._slots.after.body, template.locals),
        head: this.buildSlot(this._slots.after.head, template.locals),
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
    // render utils
    buildSlot,
    _write,

    // default options
    template: '',

    install() {
      console.log('LAYOUT', this.class);

      /* istanbul ignore else */
      if (this.class === 'Grown.Render.Layout' || !this._render) {
        throw new Error('Include this module first');
      }

      this._slots = {
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
    },

    mixins() {
      const self = this;

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
