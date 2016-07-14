var server = require('homegrown')();

var IncomingForm = require('formidable').IncomingForm;

server.listen(5000, function (app) {
  console.log('Listening on', app.location.href);
});

server.mount(function (conn) {
  if (conn.type.indexOf('multipart') === -1) {
    return;
  }

  return new Promise(function (resolve, reject) {
    var form = new IncomingForm({
      multiples: true,
      hash: 'md5'
    });

    form.parse(conn.req, function (err, fields, uploads) {
      if (err) {
        reject(err);
      } else {
        conn.req.body = conn.req.body || {};

        Object.keys(fields).forEach(function (key) {
          conn.req.body[key] = fields[key];
        });

        conn.files = uploads;

        resolve(conn);
      }
    });
  });
});

server.mount(function (conn) {
  if (conn.req.url === '/') {
    conn.body = '<form method="post" enctype="multipart/form-data" action="/upload">'
      + '<input type="file" name="f" multiple><input type="submit" name="ok">'
      + '</form>';
  }

  if (conn.req.url === '/upload') {
    conn.body = {
      body: conn.req.body,
      type: conn.type,
      files: conn.files
    };
  }
});
