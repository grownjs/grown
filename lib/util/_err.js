'use strict';

const util = require('./index');

const rePaths = /^\s*(.+?)\s*\((.+?):?([\d:]+?)\)$/gm;

function dirs(str) {
  return str.replace(rePaths, ($0, msg, src, loc) =>
    `<li>&bigstar; ${msg} <var>&rarr; ${src} <small>(line:${loc.split(':').join(', col:')})</small></var></li>`);
}

function renderHtml($) {
  return `<style>
    body[has-error] { background-color: #E6E6E6; }
    body[has-error] [is-error] {
      box-shadow: 0px 2px 3px rgba(0, 0, 0, .33);
      background-color: #FBFBFB;
      padding: 20px;
      color: #111111;
    }
    * ~ [is-error] { margin-top: 10px; }
    [is-error] * {
      margin: 0;
      line-height: 1.2;
    }
    [is-error] p,
    [is-error] ul,
    [is-error] pre,
    [is-error] blockquote { margin-top: 10px; }
    [is-error] {
      color: inherit;
      background-color: inherit;
      font-family: 'Lucida Console', Monaco, monospace;
      font-size: 10pt;
      max-width: 1200px;
      min-width: 200px;
      overflow: hidden;
      margin-left: auto;
      margin-right: auto;
    }
    [is-error] dd,
    [is-error] li {
      word-wrap: break-word;
      word-break: break-word;
      white-space: pre-line;
    }
    [is-error] pre { overflow: auto; }
    [is-error] dt { font-weight: bold; }
    [is-error] dd {
      color: #AAAAAA;
      padding: 0 0 10px 0;
    }
    [is-error] dd pre { margin: 0; }
    [is-error] blockquote pre { margin: 10px; }
    [is-error] blockquote { border: 3px double #AAAAAA; }
    [is-error] summary {
      cursor: pointer;
      margin-bottom: 10px;
    }
    [is-error] small { color: #AAAAAA; }
    [is-error] .vars var {
      background-color: #DDDDDD;
      display: inline-block;
      margin-bottom: 10px;
      padding: 5px;
    }
    [is-error] .push { margin-bottom: 10px; }
    [is-error] .call > summary,
    [is-error] .call > span {
      display: inline-block;
      padding: 10px;
    }
    [is-error] .call > span {
      background-color: #DDDDDD;
      color: #AAAAAA;
    }
    [is-error] .call .errored {
      color: white;
      background-color: #FF4136;
    }
    [is-error] .call > summary {
      background-color: #AAAAAA;
      color: white;
    }
    [is-error] .call > summary:focus { outline: none; }
    [is-error] .call ul {
      list-style-type: none;
      padding: 0;
    }
    [is-error] .call li var { display: block; }
    [is-error] .call li small { float: right; }
    [is-error] .call li { margin-bottom: 10px; }
    [is-error] .call.red dt, [is-error] .call.red var { color: #FF4136; }
    [is-error] .call.red[open] summary { background-color: #FF4136; }
    [is-error] .call.blue dt, [is-error] .call.blue var { color: #0074D9; }
    [is-error] .call.blue[open] summary { background-color: #0074D9; }
    [is-error] .call.green dt, [is-error] .call.green var { color: #2ECC40; }
    [is-error] .call.green[open] summary { background-color: #2ECC40; }
    [is-error] .call.olive dt, [is-error] .call.olive var { color: #3D9970; }
    [is-error] .call.olive[open] summary { background-color: #3D9970; }
    [is-error] .call.maroon dt, [is-error] .call.maroon var { color: #85144B; }
    [is-error] .call.maroon[open] summary { background-color: #85144B; }
    [is-error] .call.purple dt, [is-error] .call.purple var { color: #B10DC9; }
    [is-error] .call.purple[open] summary { background-color: #B10DC9; }
    [is-error] .empty {
      background-color: #AAAAAA;
      color: #111111;
      opacity: .5;
    }
    @media screen and (min-width: 30em) {
      [is-error] dt {
        float: left;
        clear: left;
        width: 15em;
        text-align: right;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      [is-error] dd { margin: 0 0 0 16em; }
    }
  </style>

<div is-error>
  <div class="call">
    <h1>⚠ ${$.error.name}</h1>

    ${$.error.summary
      ? `<p>${$.error.summary}</p>`
      : ''}

    ${$.error.message !== $.error.name
      ? `<blockquote class="push"><pre>${$.error.message}</pre></blockquote>`
      : ''}

    ${$.error.call ? `<p class="call push">
      <span>${
        $.error.call[0].join(' &rarr; ') || '^'
      }</span><span class="errored">&rarr; ${
        $.error.call[1]
      } &rarr;</span><span>${
        $.error.call[2].join(' &rarr; ') || '$'
      }</span>
    </p>` : ''}
  </div>

  ${$.context.handler && $.context.handler.verb ? `<details class="call blue">
    <summary>handler</summary>
    <dl>
      <dt>match</dt><dd>${$.context.handler.verb} ${$.context.handler.path}</dd>
      <dt>action</dt><dd>${$.context.handler.controller}#${$.context.handler.action}</dd>
      <dt>middleware</dt><dd>${util.safeValue($.context.handler.use || [], true)}</dd>
      <dt>alias</dt><dd>${$.context.handler.as}</dd>
    </dl>
  </details>` : ''}

  ${Object.keys($.context.params).length ? `<details class="call green">
    <summary>params</summary>
    <dl>
      ${Object.keys($.context.params).map(key =>
        `<dt title="${key}">${key}</dt><dd>${util.safeValue($.context.params[key], true)}</dd>`)
        .join('\n')}
    </dl>
  </details>` : ''}

  <details class="call olive">
    <summary>locals</summary>
    <dl>
      ${Object.keys($.context.resp_locals)
        .filter(x => $.context.resp_locals[x] !== $.context[x])
        .map(key =>
        `<dt title="${key}">${key}</dt><dd><pre>${util.safeValue($.context.resp_locals[key], true)}</pre></dd>`)
        .join('\n')}
    </dl>
  </details>

  ${$.error.stack ? `<details class="call red">
    <summary>stack</summary>
    <ul>${dirs($.error.stack)}</ul>
  </details>` : ''}

  ${$.error.errors.length ? `<details class="call">
    <summary>errors (${$.error.errors.length})</summary>
    <ul>
      ${$.error.errors.map(x =>
        `<li><pre>${util.safeJSON(x)}</pre></li>`)
        .join('\n')}
    </ul>
  </details>` : ''}

  <details class="call maroon">
    <summary>conn</summary>
    <dl>
      ${Object.keys($.context).map(key =>
        (Array.isArray($.context[key])
          || typeof $.context[key] === 'string'
          || typeof $.context[key] === 'number'
          ? `<dt>${key}</dt><dd>${util.safeValue($.context[key], true)}</dd>\n`
          : '')).join('')}
    </dl>
  </details>

  <details class="call purple">
    <summary>env</summary>
    <dl>
      ${Object.keys($.context.env)
        .filter(x => x.indexOf('npm_') === -1)
        .map(key =>
          `<dt title="${key}">${key}</dt><dd>${util.safeValue($.context.env[key], true)}</dd>`)
        .join('\n')}
    </dl>
  </details>
</div>
`;
}

// FIXME: test plain/text
function renderText() {}

module.exports = $ =>
  ($.type === 'html'
    ? renderHtml($)
    : renderText($));
