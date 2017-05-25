---
title: FTW
$render: ../../../_layouts/default.pug
---

### Interactive mode (reload)

Reload all your code without restarting the whole process call `.reload` on the REPL.

&mdash; Closing the farm will also stop and teardown any hooked events:

```js
$.on('close', () => {
  console.log('All connections were properly closed?');
});
```

Be sure to listen `close` for cleanup anything else.

- [back](/)
- [next](/docs/assets)
