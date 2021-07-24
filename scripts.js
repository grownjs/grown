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
window.stork.register("docs", "index.st", {
  minimumQueryLength: 2
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbHZhcm8vV29ya3NwYWNlL2dyb3duL3dlYnNpdGUvc3JjL3NjcmlwdHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIHRhcmdldCwgUnVuS2l0LCBfX3J1bmtpdF9fICovXG5cbmNvbnN0IGFjdGl2ZUxvY2F0aW9uID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXFwvJC8sICcnKSB8fCAnLyc7XG5jb25zdCBsaW5rU2VsZWN0b3IgPSBgI3NpZGViYXIgYVtocmVmJD1cIiR7YWN0aXZlTG9jYXRpb259XCJdYDtcbmNvbnN0IGFjdGl2ZUxpbmsgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGxpbmtTZWxlY3Rvcik7XG5cbmZ1bmN0aW9uIGxpbmtzKGJhc2VVUkwpIHtcbiAgaWYgKHR5cGVvZiB0YXJnZXQgPT09ICd1bmRlZmluZWQnKSByZXR1cm47XG5cbiAgdGFyZ2V0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB0YXJnZXQuZGF0YXNldC5sYWJlbCA9ICdyZWFkeSc7XG4gIHRhcmdldC5pbm5lckhUTUwgPSAnPGlmcmFtZSBuYW1lPVwiZXh0ZXJuYWxcIj48L2lmcmFtZT4nO1xuXG4gIHRhcmdldC5maXJzdENoaWxkLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiB7XG4gICAgdGFyZ2V0LmRhdGFzZXQubGFiZWwgPSAnUmVzcG9uc2U6JztcbiAgfSk7XG5cbiAgW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhPmNvZGUnKSkuZm9yRWFjaChub2RlID0+IHtcbiAgICBpZiAoIW5vZGUuZGF0YXNldC5ocmVmKSBub2RlLmRhdGFzZXQuaHJlZiA9IG5vZGUucGFyZW50Tm9kZS5ocmVmLnJlcGxhY2UobG9jYXRpb24ub3JpZ2luLCAnJyk7XG5cbiAgICBub2RlLnBhcmVudE5vZGUuc2V0QXR0cmlidXRlKCd0YXJnZXQnLCAnZXh0ZXJuYWwnKTtcbiAgICBub2RlLnBhcmVudE5vZGUuc2V0QXR0cmlidXRlKCdocmVmJywgYmFzZVVSTCArIG5vZGUuZGF0YXNldC5ocmVmKTtcbiAgICBub2RlLnBhcmVudE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICB0YXJnZXQuZGF0YXNldC5sYWJlbCA9ICdSZXF1ZXN0aW5nLi4uJztcbiAgICB9KTtcbiAgfSk7XG59XG5cbmNvbnN0IGlzRGFyayA9IHdpbmRvdy5tYXRjaE1lZGlhICYmIHdpbmRvdy5tYXRjaE1lZGlhKCcocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspJykubWF0Y2hlcztcbmNvbnN0IG5vdGVib29rcyA9IFtdO1xuXG5sZXQgdGhlbWUgPSB3aW5kb3cubG9jYWxTdG9yYWdlLnRoZW1lIHx8ICcnO1xuZnVuY3Rpb24gbG9hZFRoZW1lKCkge1xuICBub3RlYm9va3MuZm9yRWFjaChub3RlYm9vayA9PiB7XG4gICAgbm90ZWJvb2suc2V0VGhlbWUodGhlbWUgPT09ICdkYXJrJyA/ICdhdG9tLWRhcmsnIDogJ2F0b20tbGlnaHQnKTtcbiAgfSk7XG4gIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3RoZW1lJywgdGhlbWUpO1xuICBpZiAodGhlbWUgPT09IChpc0RhcmsgPyAnZGFyaycgOiAnbGlnaHQnKSkge1xuICAgIGRlbGV0ZSB3aW5kb3cubG9jYWxTdG9yYWdlLnRoZW1lO1xuICB9XG59XG53aW5kb3cudG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICB0aGVtZSA9IHRoZW1lID09PSAnbGlnaHQnID8gJ2RhcmsnIDogJ2xpZ2h0JztcbiAgd2luZG93LmxvY2FsU3RvcmFnZS50aGVtZSA9IHRoZW1lO1xuICBsb2FkVGhlbWUoKTtcbn0pO1xuaWYgKCF0aGVtZSkge1xuICBpZiAoaXNEYXJrKSB7XG4gICAgdGhlbWUgPSAnZGFyayc7XG4gIH1cblxuICB3aW5kb3cubWF0Y2hNZWRpYSgnKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGUgPT4ge1xuICAgIHRoZW1lID0gZS5tYXRjaGVzID8gJ2RhcmsnIDogJ2xpZ2h0JztcbiAgICBsb2FkVGhlbWUoKTtcbiAgfSk7XG59XG5sb2FkVGhlbWUoKTtcblxuW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdwcmUgY29kZS5sYW5nLWpzJykpLmZvckVhY2goc291cmNlID0+IHtcbiAgaWYgKCFzb3VyY2UuaW5uZXJUZXh0LmluY2x1ZGVzKCdyZXF1aXJlKCcpKSByZXR1cm47XG5cbiAgY29uc3QgaXNFbmRwb2ludCA9IF9fcnVua2l0X18uZW5kcG9pbnQ7XG4gIGNvbnN0IHNvdXJjZUNvZGUgPSBzb3VyY2UuaW5uZXJUZXh0O1xuICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG4gIGEuaW5uZXJUZXh0ID0gJ+KWuiBSVU4nO1xuICBhLmhyZWYgPSBsb2NhdGlvbi5ocmVmO1xuICBhLm9uY2xpY2sgPSBlID0+IHtcbiAgICBpZiAoYS5fbG9ja2VkKSByZXR1cm47XG5cbiAgICBhLl9sb2NrZWQgPSB0cnVlO1xuICAgIGRlbGV0ZSBhLm9uY2xpY2s7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIGVsLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICBlbC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuICAgIHNvdXJjZS5wYXJlbnROb2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsLCBzb3VyY2UucGFyZW50Tm9kZSk7XG5cbiAgICBjb25zdCBub3RlYm9vayA9IFJ1bktpdC5jcmVhdGVOb3RlYm9vayh7XG4gICAgICBlbGVtZW50OiBlbCxcbiAgICAgIHNvdXJjZTogc291cmNlQ29kZSxcbiAgICAgIHRoZW1lOiB0aGVtZSA9PT0gJ2RhcmsnID8gJ2F0b20tZGFyaycgOiAnYXRvbS1saWdodCcsXG4gICAgICBtb2RlOiBpc0VuZHBvaW50ICYmICdlbmRwb2ludCcsXG4gICAgICB0aXRsZTogX19ydW5raXRfXy50aXRsZSB8fCAnVW50aXRsZWQnLFxuICAgICAgcHJlYW1ibGU6IChfX3J1bmtpdF9fLnByZWFtYmxlID8gX19ydW5raXRfXy5wcmVhbWJsZS5jb250ZW50cyB8fCAnJyA6ICcnKVxuICAgICAgICArIChpc0VuZHBvaW50ID8gJ1xcbmV4cG9ydHMuZW5kcG9pbnQ9KHJlcSxyZXMpPT57cmVzLmVuZCgpfScgOiAnJyksXG4gICAgICBlbnZpcm9ubWVudDogW3sgbmFtZTogJ1VfV0VCU09DS0VUU19TS0lQJywgdmFsdWU6ICd0cnVlJyB9XSxcbiAgICAgIGd1dHRlclN0eWxlOiAnbm9uZScsXG4gICAgICBldmFsdWF0ZU9uTG9hZDogdHJ1ZSxcbiAgICAgIG9uTG9hZDogKCkgPT4ge1xuICAgICAgICBzb3VyY2UucGFyZW50Tm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNvdXJjZS5wYXJlbnROb2RlKTtcbiAgICAgICAgZWwuc3R5bGUucG9zaXRpb24gPSAnc3RhdGljJztcbiAgICAgIH0sXG4gICAgICBvblVSTENoYW5nZWQ6ICgpID0+IG5vdGVib29rLmdldEVuZHBvaW50VVJMKCkudGhlbihsaW5rcyksXG4gICAgfSk7XG5cbiAgICBub3RlYm9va3MucHVzaChub3RlYm9vayk7XG4gIH07XG5cbiAgc291cmNlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoYSk7XG59KTtcblxuaWYgKGFjdGl2ZUxpbmsgJiYgYWN0aXZlTG9jYXRpb24gIT09ICcvJykge1xuICBhY3RpdmVMaW5rLnNjcm9sbEludG9WaWV3KHtcbiAgICBibG9jazogJ2VuZCcsXG4gIH0pO1xufVxuXG53aW5kb3cuc3RvcmsucmVnaXN0ZXIoJ2RvY3MnLCAnaW5kZXguc3QnLCB7XG4gIG1pbmltdW1RdWVyeUxlbmd0aDogMixcbn0pO1xuIl0sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLGlCQUFpQixT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
