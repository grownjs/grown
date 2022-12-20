/* eslint-disable no-unused-expressions */
const { expect } = require('chai');

const Grown = require('../../..')();

Grown.use(require('../../test'));
Grown.use(require('..'));

/* global beforeEach, describe, it */

describe('Grown.Conn', () => {
  let server;
  beforeEach(() => {
    server = new Grown();
    server.plug(Grown.Conn);
    server.plug(Grown.Test);
  });

  describe('Request', () => {
    const options = {
      headers: {
        'content-type': 'application/json',
      },
      body: '{"foo":"bar"}',
    };

    it('should add handful props and methods', () => {
      return server.request('/', 'POST', options, (err, conn) => {
        expect(conn.req_headers).to.eql({
          'content-type': 'application/json',
          'content-length': '13',
        });

        expect(conn.is_xhr).to.be.false;
        expect(conn.is_json).to.be.true;
        expect(conn.host).to.eql('0.0.0.0');
        expect(conn.port).to.eql('80');
        expect(conn.remote_ip).to.eql('0.0.0.0');
        expect(conn.method).to.eql('POST');
        expect(conn.params).to.eql({});
        expect(conn.path_info).to.eql([]);
        expect(conn.path_params).to.eql({});
        expect(conn.body_params).to.eql({});
        expect(conn.request_path).to.eql('/');
        expect(conn.query_string).to.eql('');
        expect(conn.query_params).to.eql({});
        expect(conn.accept_charsets).to.eql(['*']);
        expect(conn.accept_encodings).to.eql(['identity']);
        expect(conn.accept_languages).to.eql(['*']);
        expect(conn.accept_types).to.eql(['*/*']);

        expect(conn.has_type('text')).to.be.false;
        expect(conn.has_type('json')).to.eql('json');
        expect(err).to.be.null;
      });
    });

    it('should handle req.headers', () => {
      return server.request('/', options, (err, conn) => {
        expect(conn.get_req_header('content-length')).to.eql('13');

        expect(() => conn.get_req_header(-1)).to.throw(/Invalid req_header/);
        expect(() => conn.put_req_header(-1)).to.throw(/Invalid req_header/);
        expect(() => conn.delete_req_header(-1)).to.throw(/Invalid req_header/);

        conn.put_req_header('foo-bar', 'baz buzz');
        expect(conn.get_req_header('foo-bar')).to.eql('baz buzz');
        conn.delete_req_header('foo-bar');
        expect(conn.get_req_header('foo-bar')).to.be.undefined;
        expect(err).to.be.null;
      });
    });

    it('should extract host/port from headers', () => {
      return server.request('/', {
        headers: {
          host: 'localhost:8080',
        },
      }, (err, conn) => {
        expect(conn.host).to.eql('localhost');
        expect(conn.port).to.eql('8080');
        expect(err).to.be.null;
      });
    });
  });

  describe('Response', () => {
    it('should add handful props and methods', () => {
      return server.request('/', (err, conn) => {
        expect(conn.has_body).to.be.false;
        expect(conn.has_status).to.be.true;

        expect(conn.content_type).to.eql('text/html');
        expect(() => { conn.content_type = 42; }).to.throw(/Invalid type/);

        expect(conn.status_code).to.eql(200);
        expect(() => { conn.status_code = []; }).to.throw(/Invalid status_code/);

        expect(conn.resp_body).to.be.null;
        expect(() => { conn.resp_body = []; }).to.throw(/Invalid resp_body/);
        expect(() => { conn.resp_body = new Array(101).join('A'); }).not.to.throw();

        expect(conn.resp_charset).to.eql('utf8');
        expect(() => { conn.resp_charset = ''; }).not.to.throw();
        expect(() => { conn.resp_charset = -1; }).to.throw(/Invalid charset/);
        expect(err).to.be.null;
      });
    });

    it('should handle resp.headers', () => {
      return server.request('/', (err, conn) => {
        expect(conn.resp_headers).to.eql({
          'content-type': 'text/html; charset=utf8',
        });
        expect(() => { conn.resp_headers = {}; }).not.to.throw();
        expect(() => { conn.resp_headers = -1; }).to.throw(/Invalid headers/);

        conn.put_resp_header('x-truth', '42');
        conn.merge_resp_headers({ foo: 'bar', baz: 'buzz' });
        conn.delete_resp_header('foo');

        expect(conn.get_resp_header('x-truth')).to.eql('42');
        expect(conn.get_resp_header('foo')).to.be.undefined;
        expect(conn.get_resp_header('baz')).to.eql('buzz');

        expect(() => conn.put_resp_header(-1)).to.throw(/Invalid resp_header/);
        expect(() => conn.get_resp_header(-1)).to.throw(/Invalid resp_header/);
        expect(() => conn.merge_resp_headers(-1)).to.throw(/Invalid resp_header/);
        expect(() => conn.delete_resp_header(-1)).to.throw(/Invalid resp_header/);
        expect(err).to.be.null;
      });
    });

    it('should handle redirect()', () => {
      server.mount(conn => {
        expect(() => conn.redirect(-1)).to.throw(/Invalid location/);

        return conn.redirect('/fix?a=b');
      });

      return server.request('/', (err, conn) => {
        expect(conn.resp_headers).to.eql({
          'content-type': 'text/html; charset=utf8',
          location: '/fix?a=b',
        });
        expect(err).to.be.null;
      });
    });

    it('should handle redirect() with full-urls', () => {
      server.mount(conn => conn.redirect('https://api.soypache.co:8080'));

      return server.request('/', (err, conn) => {
        expect(conn.resp_headers).to.eql({
          'content-type': 'text/html; charset=utf8',
          location: 'https://api.soypache.co:8080/',
        });
        expect(err).to.be.null;
      });
    });

    it('should handle redirect() with timeout', () => {
      server.mount(conn => conn.redirect('/wait', 1000));

      return server.request('/', (err, conn) => {
        expect(conn.res.body).to.contain('<meta http-equiv="refresh" content="1000;url=/wait">');
        expect(err).to.be.null;
      });
    });

    it('should handle json()', () => {
      server.mount(conn => {
        expect(() => conn.json(-1)).to.throw(/Invalid JSON/);

        return conn.json({ foo: 'bar' });
      });

      return server.request('/', (err, conn) => {
        expect(conn.res.body).to.eql('{"foo":"bar"}');
        expect(err).to.be.null;
      });
    });

    it('should handle send_file()', () => {
      server.mount(conn => conn.send_file({ file: __filename }));

      return server.request('/', (err, conn) => {
        expect(conn.res.body).to.contain('should handle send_file()');
        expect(err).to.be.null;
      });
    });

    it('should handle send()', () => {
      server.mount(conn => conn.send('OSOM'));

      return server.request('/', (err, conn) => {
        expect(conn.res.body).to.eql('OSOM');
        expect(err).to.be.null;
      });
    });

    it('should handle send() as buffer', () => {
      server.mount(conn => conn.send(Buffer.from('OSOM')));

      return server.request('/', (err, conn) => {
        expect(conn.res.body).to.eql('OSOM');
        expect(err).to.be.null;
      });
    });

    it('should handle send() as stream', () => {
      server.mount(conn => conn.send(require('fs').createReadStream(__filename)));

      return server.request('/', (err, conn) => {
        expect(conn.res.body).to.contain('should handle send() as stream');
        expect(err).to.be.null;
      });
    });

    it('should handle send() failures', () => {
      server.mount(conn => {
        conn.res.finished = true;

        return conn.send().catch(e => {
          expect(e.message).to.match(/Already finished/);
        });
      });

      return server.request('/', (err, conn) => conn.res.ok(err));
    });

    it('should handle end()', () => {
      server.mount(conn => conn.end(201));

      return server.request('/', (err, conn) => conn.res.ok(err, '', 201));
    });

    it('should handle end() with text', () => {
      server.mount(conn => conn.end('OSOM'));

      return server.request('/', (err, conn) => conn.res.ok(err, 'OSOM', 200));
    });

    it('should handle end() with error', () => {
      server.mount(conn => {
        const e = new Error('Unexpected');

        e.toString = () => 'FAILURE';
        delete e.message;
        return conn.end(e);
      });

      return server.request('/', (err, conn) => conn.res.ok(err, 'FAILURE', 500));
    });

    it('should handle end() with message', () => {
      server.mount(conn => conn.end(400, 'Invalid input'));

      return server.request('/', (err, conn) => conn.res.ok(err, 'Invalid input', 400));
    });

    it('should handle end() failures', () => {
      server.mount(conn => {
        conn.res.finished = true;
        expect(() => conn.end()).to.throw(/Already finished/);
      });

      return server.request('/', (err, conn) => conn.res.ok(err, 200));
    });

    it('should handle shared state', () => {
      const template = {
        locals: {
          foo: 'bar',
        },
      };

      server.mount(conn => {
        conn.state.title = 'Untitled';

        return server.emit('before_render', conn, template);
      });

      return server.request('/', (err, conn) => conn.res.ok(err, 200));
    });

    it('should handle halting', () => {
      let count = 0;
      server.mount(conn => conn.halt(() => {
        count += 1;
        throw new Error('WUT');
      }));

      return server.request('/', (err, conn) => {
        expect(count).to.eql(2);
        expect(conn.res._done).to.be.true;
        conn.res.ok(err, 500, 'WUT');
      });
    });
  });
});
