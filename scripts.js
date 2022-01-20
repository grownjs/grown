const activeLocation = location.pathname.replace(/\/$/, "") || "/";
const linkSelector = `#sidebar a[href$="${activeLocation}"]`;
const activeLink = document.querySelector(linkSelector);
function links(baseURL) {
  if (typeof target === "undefined")
    return;
  target.style.display = "block";
  target.dataset.label = "ready";
  target.innerHTML = '<iframe name="external"></iframe>';
  target.firstChild.addEventListener("load", () => {
    target.dataset.label = "Response:";
  });
  [].slice.call(document.querySelectorAll("a>code")).forEach((node) => {
    if (!node.dataset.href)
      node.dataset.href = node.parentNode.href.replace(location.origin, "");
    node.parentNode.setAttribute("target", "external");
    node.parentNode.setAttribute("href", baseURL + node.dataset.href);
    node.parentNode.addEventListener("click", () => {
      target.dataset.label = "Requesting...";
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
window.toggle.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  window.localStorage.theme = theme;
  loadTheme();
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
[].slice.call(document.querySelectorAll("pre code.lang-js")).forEach((source) => {
  if (!source.innerText.includes("require("))
    return;
  const isEndpoint = __runkit__.endpoint;
  const sourceCode = source.innerText;
  const a = document.createElement("a");
  a.innerText = "\u25BA RUN";
  a.href = location.href;
  a.onclick = (e) => {
    if (a._locked)
      return;
    a._locked = true;
    delete a.onclick;
    e.preventDefault();
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
      preamble: (__runkit__.preamble ? __runkit__.preamble.contents || "" : "") + (isEndpoint ? "\nexports.endpoint=(req,res)=>{res.end()}" : ""),
      environment: [{ name: "U_WEBSOCKETS_SKIP", value: "true" }],
      gutterStyle: "none",
      evaluateOnLoad: true,
      onLoad: () => {
        source.parentNode.parentNode.removeChild(source.parentNode);
        el.style.position = "static";
      },
      onURLChanged: () => notebook.getEndpointURL().then(links)
    });
    notebooks.push(notebook);
  };
  source.parentNode.appendChild(a);
});
if (activeLink && activeLocation !== "/") {
  activeLink.scrollIntoView({
    block: "end"
  });
}
//# sourceMappingURL=data:application/json;base64,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
