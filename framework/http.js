const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

module.exports = Grown => {
  function download(url, fileName) {
    return new Promise((resolve, reject) => {
      const dest = path.join(Grown.cwd, 'tmp/files', fileName);
      const file = fs.createWriteStream(dest);

      (url.indexOf('https:') !== -1 ? https : http)
        .get(url, response => {
          response.pipe(file);
          file.on('finish', () => file.close(() => resolve(`files/${fileName}`)));
        }).on('error', err => {
          fs.unlink(dest);
          reject(err);
        });
    })
  }

  return {
    HTTP: {
      download,
    },
  };
};
