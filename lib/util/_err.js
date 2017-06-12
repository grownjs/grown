'use strict';

// TODO: all non-enumerable methods can be safely skipped

const rePaths = /^\s*(.+?)\s*\((.+?):?([\d:]+?)\)$/gm;

function dirs(str) {
  return str.replace(rePaths, ($0, str, src, loc) =>
    `<li>${str} <var>&rarr; ${src}</var> <small>(line: ${loc.split(':').join(', col: ')})</small></li>`);
}

function safe(str) {
  if (Array.isArray(str)) {
    return `[ ${str.map(safe).join(', ')} ]`;
  }

  if (str instanceof RegExp) {
    return str.toString();
  }

  if (typeof str === 'string' && !str.length) {
    return '<span class="empty">EMPTY</span>';
  }

  return str;
}

function prune(key, value) {
  if (key.charAt() === '_' || typeof value === 'function') {
    return undefined;
  }

  return safe(value);
}

function renderHtml($) {
  return `<div class="call">
    <h1>⚠ ${$.error.name}</h1>

    ${$.error.summary
      ? `<p>${$.error.summary}</p>`
      : ''}

    ${$.error.message !== $.error.name
      ? `<blockquote><pre>${$.error.message}</pre></blockquote>`
      : ''}

    ${$.error.call ? `<p class="call">
      <span>${
        $.error.call[0].join(' &rarr; ') || '^'
      }</span><span class="errored">&rarr; ${
        $.error.call[1]
      } &rarr;</span><span>${
        $.error.call[2].join(' &rarr; ') || '$'
      }</span>
    </p>` : ''}
  </div>

  ${$.context.handler ? `<details class="call blue">
    <summary>handler</summary>
    <dl>
      <dt>match</dt><dd>${$.context.handler.verb} ${$.context.handler.path}</dd>
      <dt>regexp</dt><dd>${$.context.handler.matcher.regex}</dd>
      <dt>action</dt><dd>${$.context.handler.controller}#${$.context.handler.action}</dd>
      <dt>middleware</dt><dd>${safe($.context.handler.use)}</dd>
      <dt>alias</dt><dd>${$.context.handler.as}</dd>
    </dl>
  </details>`: ''}

  ${$.error.stack ? `<details class="call red">
    <summary>stack</summary>
    <ul>${dirs($.error.stack)}</ul>
  </details>`: ''}

  ${$.error.errors.length ? `<details class="call">
    <summary>errors (${$.error.errors.length})</summary>
    <ul>
      ${$.error.errors.map(x =>
        `<li><pre>${JSON.stringify(x, prune, 2)}</pre></li>`)
        .join('\n')}
    </ul>
  </details>` : ''}

  ${Object.keys($.context.params).length ? `<details class="call green">
    <summary>params</summary>
    <dl>
      ${Object.keys($.context.params).map(key =>
        `<dt title="${key}">${key}</dt><dd>${safe($.context.params[key])}</dd>`
      ).join('\n')}
    </dl>
  </details>` : ''}

  <details class="call olive">
    <summary>conn</summary>
    <dl>
      <dt>host</dt><dd>${safe($.context.host)}</dd>
      <dt>port</dt><dd>${safe($.context.port)}</dd>
      <dt>scheme</dt><dd>${safe($.context.scheme)}</dd>
      <dt>remote_ip</dt><dd>${safe($.context.remote_ip)}</dd>
      <dt>script_name</dt><dd>${safe($.context.script_name)}</dd>
      <dt>method</dt><dd>${safe($.context.method)}</dd>
      <dt>path_info</dt><dd>${safe($.context.path_info)}</dd>
      <dt>request_path</dt><dd>${safe($.context.request_path)}</dd>
      <dt>status_code</dt><dd>${safe($.context.status_code)}</dd>
      <dt>resp_charset</dt><dd>${safe($.context.resp_charset)}</dd>
    </dl>
  </details>

  <details class="call maroon">
    <summary>env</summary>
    <dl>
      ${Object.keys($.context.env).map(key =>
        `<dt title="${key}">${key}</dt><dd>${safe($.context.env[key])}</dd>`
      ).join('\n')}
    </dl>
  </details>
`;
}

function renderText() {}

module.exports = $ =>
  ($.type === 'html'
    ? renderHtml($)
    : renderText($));
