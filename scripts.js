
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
    var target = document.createElement('div');
    source.parentNode.parentNode.insertBefore(target, source.parentNode);
    source.parentNode.parentNode.removeChild(source.parentNode);
    RunKit.createNotebook({
      element: target,
      source: sourceCode,
      mode: isEndpoint && 'endpoint',
      title: snippet.title || 'Untitled',
      preamble: snippet.preamble,
      gutterStyle: 'none',
      evaluateOnLoad: true,
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
