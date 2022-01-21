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
document.addEventListener("DOMContentLoaded", () => {
  window.toggle.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    window.localStorage.theme = theme;
    loadTheme();
  });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2NyaXB0cy5qcyJdLAogICJtYXBwaW5ncyI6ICJBQUVBLE1BQU0saUJBQWlCLFNBQVMsU0FBUyxRQUFRLE9BQU8sT0FBTztBQUMvRCxNQUFNLGVBQWUscUJBQXFCO0FBQzFDLE1BQU0sYUFBYSxTQUFTLGNBQWM7QUFFMUMsZUFBZSxTQUFTO0FBQ3RCLE1BQUksT0FBTyxXQUFXO0FBQWE7QUFFbkMsU0FBTyxNQUFNLFVBQVU7QUFDdkIsU0FBTyxRQUFRLFFBQVE7QUFDdkIsU0FBTyxZQUFZO0FBRW5CLFNBQU8sV0FBVyxpQkFBaUIsUUFBUSxNQUFNO0FBQy9DLFdBQU8sUUFBUSxRQUFRO0FBQUE7QUFHekIsS0FBRyxNQUFNLEtBQUssU0FBUyxpQkFBaUIsV0FBVyxRQUFRLFVBQVE7QUFDakUsUUFBSSxDQUFDLEtBQUssUUFBUTtBQUFNLFdBQUssUUFBUSxPQUFPLEtBQUssV0FBVyxLQUFLLFFBQVEsU0FBUyxRQUFRO0FBRTFGLFNBQUssV0FBVyxhQUFhLFVBQVU7QUFDdkMsU0FBSyxXQUFXLGFBQWEsUUFBUSxVQUFVLEtBQUssUUFBUTtBQUM1RCxTQUFLLFdBQVcsaUJBQWlCLFNBQVMsTUFBTTtBQUM5QyxhQUFPLFFBQVEsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUs3QixNQUFNLFNBQVMsT0FBTyxjQUFjLE9BQU8sV0FBVyxnQ0FBZ0M7QUFDdEYsTUFBTSxZQUFZO0FBRWxCLElBQUksUUFBUSxPQUFPLGFBQWEsU0FBUztBQUN6QyxxQkFBcUI7QUFDbkIsWUFBVSxRQUFRLGNBQVk7QUFDNUIsYUFBUyxTQUFTLFVBQVUsU0FBUyxjQUFjO0FBQUE7QUFFckQsV0FBUyxnQkFBZ0IsYUFBYSxTQUFTO0FBQy9DLE1BQUksVUFBVyxVQUFTLFNBQVMsVUFBVTtBQUN6QyxXQUFPLE9BQU8sYUFBYTtBQUFBO0FBQUE7QUFJL0IsU0FBUyxpQkFBaUIsb0JBQW9CLE1BQU07QUFDbEQsU0FBTyxPQUFPLGlCQUFpQixTQUFTLE1BQU07QUFDNUMsWUFBUSxVQUFVLFVBQVUsU0FBUztBQUNyQyxXQUFPLGFBQWEsUUFBUTtBQUM1QjtBQUFBO0FBQUE7QUFJSixJQUFJLENBQUMsT0FBTztBQUNWLE1BQUksUUFBUTtBQUNWLFlBQVE7QUFBQTtBQUdWLFNBQU8sV0FBVyxnQ0FBZ0MsaUJBQWlCLFVBQVUsT0FBSztBQUNoRixZQUFRLEVBQUUsVUFBVSxTQUFTO0FBQzdCO0FBQUE7QUFBQTtBQUdKO0FBRUEsR0FBRyxNQUFNLEtBQUssU0FBUyxpQkFBaUIscUJBQXFCLFFBQVEsWUFBVTtBQUM3RSxNQUFJLENBQUMsT0FBTyxVQUFVLFNBQVM7QUFBYTtBQUU1QyxRQUFNLGFBQWEsV0FBVztBQUM5QixRQUFNLGFBQWEsT0FBTztBQUMxQixRQUFNLElBQUksU0FBUyxjQUFjO0FBRWpDLElBQUUsWUFBWTtBQUNkLElBQUUsT0FBTyxTQUFTO0FBQ2xCLElBQUUsVUFBVSxPQUFLO0FBQ2YsUUFBSSxFQUFFO0FBQVM7QUFFZixNQUFFLFVBQVU7QUFDWixXQUFPLEVBQUU7QUFDVCxNQUFFO0FBRUYsVUFBTSxLQUFLLFNBQVMsY0FBYztBQUVsQyxPQUFHLE1BQU0sV0FBVztBQUNwQixPQUFHLE1BQU0sV0FBVztBQUNwQixXQUFPLFdBQVcsV0FBVyxhQUFhLElBQUksT0FBTztBQUVyRCxVQUFNLFdBQVcsT0FBTyxlQUFlO0FBQUEsTUFDckMsU0FBUztBQUFBLE1BQ1QsUUFBUTtBQUFBLE1BQ1IsT0FBTyxVQUFVLFNBQVMsY0FBYztBQUFBLE1BQ3hDLE1BQU0sY0FBYztBQUFBLE1BQ3BCLE9BQU8sV0FBVyxTQUFTO0FBQUEsTUFDM0IsVUFBVyxZQUFXLFdBQVcsV0FBVyxTQUFTLFlBQVksS0FBSyxNQUNqRSxjQUFhLDhDQUE4QztBQUFBLE1BQ2hFLGFBQWEsQ0FBQyxFQUFFLE1BQU0scUJBQXFCLE9BQU87QUFBQSxNQUNsRCxhQUFhO0FBQUEsTUFDYixnQkFBZ0I7QUFBQSxNQUNoQixRQUFRLE1BQU07QUFDWixlQUFPLFdBQVcsV0FBVyxZQUFZLE9BQU87QUFDaEQsV0FBRyxNQUFNLFdBQVc7QUFBQTtBQUFBLE1BRXRCLGNBQWMsTUFBTSxTQUFTLGlCQUFpQixLQUFLO0FBQUE7QUFHckQsY0FBVSxLQUFLO0FBQUE7QUFHakIsU0FBTyxXQUFXLFlBQVk7QUFBQTtBQUdoQyxJQUFJLGNBQWMsbUJBQW1CLEtBQUs7QUFDeEMsYUFBVyxlQUFlO0FBQUEsSUFDeEIsT0FBTztBQUFBO0FBQUE7IiwKICAibmFtZXMiOiBbXQp9Cg==
