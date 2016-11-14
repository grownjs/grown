const server = require('..').new();

const IncomingForm = require('formidable').IncomingForm;

server.listen(5000, (app) => {
  console.log('Listening on', app.location.href);
});

function processForm(conn) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      multiples: true,
      hash: 'md5',
    });

    form.parse(conn.req, (err, fields, uploads) => {
      if (err) {
        reject(err);
      } else {
        conn.req.body = conn.req.body || {};

        Object.keys(fields).forEach((key) => {
          conn.req.body[key] = fields[key];
        });

        conn.files = uploads;

        resolve(conn);
      }
    });
  });
}

server.mount((conn) => {
  return conn.type.indexOf('multipart') === -1 || processForm(conn);
});

server.mount((conn) => {
  if (conn.req.url === '/') {
    conn.body = `<form method="post" enctype="multipart/form-data" action="/upload">
  <input type="file" name="f" multiple><input type="submit" name="ok">
</form>`;
  }

  if (conn.req.url === '/upload') {
    conn.body = {
      body: conn.req.body,
      type: conn.type,
      files: conn.files,
    };
  }
});
