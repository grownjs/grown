/* eslint-disable */

assert = require('assert');

require('protobufjs');

const fs = require('fs');

fs.mkdirSync('./handlers');
fs.mkdirSync('./handlers/Test');
fs.mkdirSync('./handlers/Test/is');

fs.writeFileSync('./handlers/Test/is/index.js', `
  module.exports = function ({ request }) {
    return { reveal: request.truth === 42 };
  };
`);

fs.writeFileSync('./index.proto', `
  syntax = "proto3";
  package API;
  service Test {
    rpc is(Input) returns (Output) {}
  }
  message Input {
    int32 truth = 1;
  }
  message Output {
    string reveal = 1;
  }
`);

Grown = require('@grown/bud')();
