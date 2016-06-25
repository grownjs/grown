var server = require('./_core')();

require('./_core/router')(process.cwd(), server);

var app = server.listen(8000);
// console.log(server);
console.log('Listening at ' + app.location.href);
