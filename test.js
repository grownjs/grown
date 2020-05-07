const Grown = require('.')();
const app = new Grown();
app.listen(ctx => {
  ctx.close();
});
