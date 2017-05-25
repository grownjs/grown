---
title: FTW
$render: ../../_layouts/default.pug
---

### Interactive mode

Execute `grown repl` to start an interactive session.

You can explore the available actions typing `.help` and hitting ENTER.

Most actions responds to the same syntax `arg1 arg2 ... -pq x=y a:b` where:

- `argN` are regular values (can be quoted)
- `-pq` are **flag** values (short or long, as CLI does)
- `x=y` are **data** values (can be quoted, e.g. `x="foo bar"`)
- `a:b` are **param** values (can be quoted, e.g. `a:"foo bar"`)

Try with `.render layouts/default csrf_token="oh noes" yield=OSOM` and see the results.

> Save/load different REPL sessions using the `-i` flag, e.g. `grown repl -i debug`

- [back](/)
- [next](/docs/controllers)
