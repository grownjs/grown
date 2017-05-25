---
title: FTW
$render: ../../../_layouts/default.pug
---

### Javascripts

Bundle from [supported sources](https://github.com/tacoss/tarima#20---supported-engines): CoffeeScript, TypeScript, Svelte, Vue, etc.

&mdash; Just rename your source files for custom support:

```
//- app/assets/javascripts/_components/example.vue.pug

template
  h1 It works!

script.
  export default {
    mounted() {
      console.log('OSOM!');
    },
  };
```

&mdash; The source is not rendered (see [filter](#asset-pipeline)), but can be loaded by an entry-point:

```js
// app/assets/javascripts/welcome.js

import Example from './_components/example.vue.pug';

new Example({
  el: '#app',
});
```

&mdash; If you need ES6 async/await support:

- install `nodent` in your project
- add `"nodent": true` to your `bundleOptions`

&mdash; Known issues:

- using `async/await` within JSX simply won't work
