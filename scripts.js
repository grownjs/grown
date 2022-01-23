const activeLocation = location.pathname.replace(/\/$/, "") || "/";
const linkSelector = `#sidebar a[href$="${activeLocation}"]`;
const activeLink = document.querySelector(linkSelector);
let iframes;
function loadIframes() {
  const targets = document.querySelectorAll("[data-external]");
  iframes = [].slice.call(targets).reduce((memo, cur) => {
    cur.style.display = "none";
    cur.dataset.label = "ready";
    cur.innerHTML = `<iframe name="${cur.id}-external"></iframe>`;
    cur.firstChild.addEventListener("load", () => {
      cur.dataset.label = "response";
    });
    memo[cur.id] = cur;
    return memo;
  }, {});
}
function targetLinks(baseURL, el) {
  [].slice.call(el.querySelectorAll("a>code")).forEach((node) => {
    if (!node.dataset.href)
      node.dataset.href = node.parentNode.href.replace(location.origin, "");
    const [link, anchor] = node.dataset.href.split("#");
    const target = iframes[anchor || "target"];
    target.style.display = "block";
    node.parentNode.setAttribute("target", `${anchor || "target"}-external`);
    node.parentNode.setAttribute("href", baseURL + link);
    node.parentNode.addEventListener("click", () => {
      target.dataset.label = "...";
    });
  });
}
const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
const notebooks = [];
let theme = window.localStorage.theme || "";
function loadTheme() {
  notebooks.forEach((notebook) => {
    notebook.setTheme(theme === "dark" ? "atom-dark" : "atom-light");
  });
  document.documentElement.setAttribute("theme", theme);
  if (theme === (isDark ? "dark" : "light")) {
    delete window.localStorage.theme;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadIframes();
  window.toggle.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    window.localStorage.theme = theme;
    loadTheme();
  });
  window.onbeforeunload = () => {
    window.localStorage.sidebar = window.sidebar.scrollTop;
  };
  if (window.localStorage.sidebar) {
    window.sidebar.scrollTop = window.localStorage.sidebar;
  }
});
if (!theme) {
  if (isDark) {
    theme = "dark";
  }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    theme = e.matches ? "dark" : "light";
    loadTheme();
  });
}
loadTheme();
const prelude = `
require('pug');
const s = require('tiny-dedent');
const fs = require('fs-extra');
const path = require('path');
const { strip } = require('ansicolor');

const toString = value => String(Buffer.from(value));
const normalizeText = msg => strip(msg.replace(/[\\r\\n\\b]/g, ''));

process.stdout.write = msg => console.log(normalizeText(toString(msg)));

global.fixture = (str, ...vars) => {
  const buffer = [];
  for (let i = 0; i < str.length; i += 1) {
    buffer.push(str[i], vars[i]);
  }
  const text = buffer.join('');
  const [file, ...result] = buffer.shift().split('\\n');
  fs.outputFileSync(file.replace(/^\\./, prefix || '.'), s(result.join('\\n')));
};

global.assert = require('assert');
global.Grown = require('@grown/bud')();

let prefix;
`;
[].slice.call(document.querySelectorAll("pre code.lang-js")).forEach((source) => {
  if (!source.innerText.includes("Grown"))
    return;
  const next = source.parentNode.nextElementSibling;
  const isEndpoint = __runkit__.endpoint;
  const sourceCode = source.innerText;
  const a = document.createElement("a");
  a.innerText = "\u25B7 RUN";
  a.href = location.href;
  a.addEventListener("click", (e) => {
    e.preventDefault();
    if (a._locked)
      return;
    a.innerText = "...";
    a._locked = true;
    delete a.onclick;
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.overflow = "hidden";
    source.parentNode.parentNode.insertBefore(el, source.parentNode);
    const notebook = RunKit.createNotebook({
      element: el,
      source: sourceCode,
      theme: theme === "dark" ? "atom-dark" : "atom-light",
      mode: isEndpoint && "endpoint",
      title: __runkit__.title || "Untitled",
      preamble: prelude + (__runkit__.preamble || "") + (isEndpoint ? "\nexports.endpoint=(req,res)=>{res.end()}" : ""),
      environment: [{ name: "U_WEBSOCKETS_SKIP", value: "true" }],
      gutterStyle: "none",
      evaluateOnLoad: true,
      onLoad: () => {
        source.parentNode.parentNode.removeChild(source.parentNode);
        el.style.position = "static";
      },
      onURLChanged: () => notebook.getEndpointURL().then((result) => targetLinks(result, next))
    });
    notebooks.push(notebook);
  });
  source.parentNode.appendChild(a);
  source.parentNode.className = "fixed";
});
if (activeLink && activeLocation !== "/") {
  activeLink.scrollIntoView({
    block: "end"
  });
}
//# sourceMappingURL=data:application/json;base64,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
