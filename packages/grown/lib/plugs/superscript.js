'use strict';

module.exports = opts => {
  const superscript = require('superscript').default;

  function botFactory() {
    let bot;

    function onReady() {
      return new Promise((resolve, reject) => {
        function done(result) {
          try {
            bot = bot || result;

            resolve();
          } catch (e) {
            reject(e);
          }
        }

        if (bot) {
          return done();
        }

        superscript.setup(opts || {}, (err, botInstance) => {
          if (err) {
            return reject(err);
          }

          done(botInstance);
        });
      });
    }

    function onPayload(sender, message, callback) {
      return new Promise((resolve, reject) => {
        if (!bot) {
          return setTimeout(() => resolve(onPayload(sender, message, callback)), 1000);
        }

        if (typeof callback === 'function') {
          message = callback(message) || message;
        }

        message = !Array.isArray(message) && message
          ? [message]
          : message;

        const results = [];

        message.map(x => () => new Promise((ok, cancel) => {
          bot.reply(sender, x, (err, reply) => {
            if (!err) {
              try {
                ok(reply);
              } catch (e) {
                cancel(reply);
              }
            } else {
              cancel(err);
            }
          });
        }))
          .reduce((prev, cur) => prev.then(() =>
            cur().then(data => { results.push(data); })), Promise.resolve())
          .then(() => resolve(results))
          .catch(reject);
      });
    }

    return { onReady, onPayload };
  }

  return $ => {
    const x = botFactory();

    $.on('listen', () => x.onReady());

    $.extensions('Conn._').superscript = x.onPayload;

    $.extensions('Conn', {
      methods: {
        superscript: x.onPayload,
      },
    });
  };
};
