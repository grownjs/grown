'use strict';

// TODO: all non-enumerable methods can be safely skipped

// function safe(value) {
//   if (typeof value === 'function') {
//     const matches = value.toString()
//       .match(/^(?:function)?\s*(.*)\((.*?)\)\s*(?:=>)?\s*\{/);

//     if (!matches) {
//       return value;
//     }

//     return `${matches[1]}(${matches[2]})`;
//   }

//   try {
//     return JSON.stringify(value);
//   } catch (e) {
//     return `${e.message} (${value})`;
//   }
// }

// function pad(str, length) {
//   return (str + (new Array(length + 1).join(' '))).substr(0, length);
// }

function renderHtml($) {
  return `<h1>An error!</h1>
    <p>Error#message: ${JSON.stringify($.error.message)}</p>
    <p>Error#errors: ${JSON.stringify($.error.errors)}</p>
    <p>Error#debug: ${JSON.stringify($.error.debug)}</p>
    <p>Error#name: ${JSON.stringify($.error.name)}</p>
    <p>Error#code: ${JSON.stringify($.error.code)}</p>
    <p>Error#call: ${JSON.stringify($.error.call)}</p>
    <p>Layout: ${$.context.layout}</p>
    <p>${Object.keys($.context).join(' ')}</p>
  `;
}

function renderText() {}

module.exports = $ =>
  ($.type === 'html'
    ? renderHtml($)
    : renderText($));
