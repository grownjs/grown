import createContainer from '.';
import TestPlug from '@grown/test';

const Grown = createContainer();
const app = new Grown({
  cors: true,
});

app.on('listen', () => process.stdout.write('0'));
app.on('start', () => process.stdout.write('1'));
app.on('done', () => process.stdout.write('2\n'));

if (process.env.NODE_ENV === 'test') {
  app.plug(Grown.use(TestPlug));
  app.request('/', (err, conn) => {
    conn.res.ok(err, 200);
  });
} else {
  app.mount(conn => {
    console.log(conn.req.method, conn.req.url);
    if (conn.req.url === '/die') {
      setTimeout(process.exit, 200);
    }
    conn.res.statusCode = 200;
    conn.res.end('OK\n');
  });

  app.listen(8080);
}
