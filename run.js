var server = require('./_core')({
  cwd: process.cwd()
});

server.use(require('./_core/router'));

var app = server.listen(8000);
// console.log(server);
console.log('Listening at ' + app.location.href);
