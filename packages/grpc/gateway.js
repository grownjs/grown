'use strict';

module.exports = Grown => {
  return Grown('GRPC.Gateway', {
    request(client, method, data) {
      return new Promise((resolve, reject) => {
        const deadline = new Date();

        deadline.setSeconds(deadline.getSeconds() + (this.timeout || 10));

        client[method](data, { deadline }, (error, result) => {
          /* istanbul ignore else */
          if (error) {
            let parsedError;

            try {
              parsedError = JSON.parse(error.message);
            } catch (e) {
              parsedError = error;
              parsedError.code = 500;
            }

            return reject(parsedError);
          }

          return resolve(result);
        });
      });
    },
  });
};
