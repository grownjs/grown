---
title: FTW
$render: ../../../_layouts/default.pug
---

#### Interactive mode (fetch)

On the REPL you can `.fetch` resources too.

Examples:

```bash
.fetch POST /account --json username=foo
.fetch destroyAccount
.fetch showLogin
.fetch ...
```

To list all available routes just type `.routes` and hit ENTER.

Try `.routes <something>` to filter out matching routes.

- [back](/)
- [next](/docs/models)
