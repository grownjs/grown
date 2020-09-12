
function links(baseURL) {
  if (typeof target === 'undefined') { return; }
  target.style.display = 'block';
  [].slice.call(document.querySelectorAll('a>code')).forEach(function (node) {
    if (!node.dataset.href) { node.dataset.href = node.parentNode.href.replace(location.origin, ''); }
    node.parentNode.setAttribute('target', 'external');
    node.parentNode.setAttribute('href', baseURL + node.dataset.href);
  });
}
[].slice.call(document.querySelectorAll('pre code.lang-js')).forEach(function (source) {
  var matches = source.innerText.match(/\/\*+\s*@runkit\s*(.+?)\s*\*+\//);
  if (!matches) { return; }
  var snippet = __runkit__[matches[1]] || __runkit__;
  var isEndpoint = snippet.endpoint;
  var sourceCode = source.innerText;
  var a = document.createElement('a');
  a.innerText = '► RUN';
  a.href = location.href;
  a.onclick = function (e) {
    if (a._locked) { return; }
    a._locked = true;
    delete a.onclick;
    e.preventDefault();
    var el = document.createElement('div');
    source.parentNode.parentNode.insertBefore(el, source.parentNode);
    source.parentNode.parentNode.removeChild(source.parentNode);
    var notebook = RunKit.createNotebook({
      element: el,
      source: sourceCode,
      mode: isEndpoint && 'endpoint',
      title: snippet.title || 'Untitled',
      preamble: snippet.preamble
        + (isEndpoint ? '\nexports.endpoint=(req,res)=>{res.end()}' : ''),
      environment: [{ name: 'U_WEBSOCKETS_SKIP', value: 'true' }],
      gutterStyle: 'none',
      evaluateOnLoad: true,
      onURLChanged: function () { return notebook.getEndpointURL().then(links); },
    });
  };
  source.parentNode.appendChild(a);
});

var activeLocation = location.pathname.replace(/\/$/, '') || '/';
var linkSelector = "#sidebar a[href$=\"" + activeLocation + "\"]";
var activeLink = document.querySelector(linkSelector);

if (activeLink && activeLocation !== '/') {
  activeLink.scrollIntoView({
    block: 'end',
  });
}
