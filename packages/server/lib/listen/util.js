'use strict';

const STATUS_CODES = require('http').STATUS_CODES;

const fs = require('fs');

function sendFile(src, opts) {
  return new Promise(resolve => {
    this.writeHead(200, (opts || {}).headers);
    fs.createReadStream(src)
      .on('data', x => this.write(x))
      .on('close', () => resolve(this.end()));
  });
}

function sendJSON(data) {
  this.setHeader('content-type', 'application/json');
  this.write(JSON.stringify(data));
  this.end();
}

function setStatus(code) {
  this.statusCode = code;
  this.statusMessage = STATUS_CODES[code] || 'unknown';
  return this;
}

function send(data) {
  if (typeof data !== 'string') {
    sendJSON(data);
    return;
  }

  if (typeof data !== 'undefined') {
    this.write(data);
  }

  this.end();
}

module.exports = {
  send,
  sendFile,
  sendJSON,
  setStatus,
};
