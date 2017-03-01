'use strict';

/* eslint-disable global-require */

const Grown = require('..');

Grown.new({
  use: [
    Grown.plugs.socket(8081),
  ],
  mount: [
    (conn) => {
      let t;

      function ping() {
        // not chained
        conn.socket('/')
          .then((socket) => {
            clearTimeout(t);

            t = setTimeout(ping, 1000);

            socket.emit('message', new Date().toISOString());
          });
      }

      if (conn.request_path === '/join') {
        // FIXME this creates too many listeners
        ping();

        return conn.redirect('/');
      }

      if (conn.request_path === '/') {
        conn.resp_body = `
          <div id="messageOutput"></div>
          <a href="/join">Join</a>
          <script src="${conn.socket_host}/socket.io/socket.io.js"></script>
          <script>
            var socket = io('${conn.socket_host}');
            socket.on('message', function (data) {
              messageOutput.innerHTML = data;
            });
          </script>
        `;
      }
    },
  ],
})
.listen(`${process.env.UWS > 0 ? 'uws' : 'http'}://0.0.0.0:5000`)
.then((app) => {
  console.log('Listening on', app.location.href);
})
.catch(error => console.log(error.stack));
