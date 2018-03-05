[].slice.call(document.querySelectorAll('pre code.lang-js')).forEach(function (source) {
  var matches = source.innerText.match(/\/\*+\s*@runkit\s*(.+?)\s*\*+\//);
  if (!matches) { return; }
  var snippet = __runkit__[matches[1]] || __runkit__;
  var isEndpoint = snippet.endpoint;
  var sourceCode = source.innerText.replace(((matches[0]) + "\n"), '');
  var a = document.createElement('a');
  a.innerText = 'Load in REPL';
  a.href = '#';
  a.onclick = function (e) {
    delete a.onclick;
    e.preventDefault();
    a.innerText = 'Loading...';
    var target = document.createElement('div');
    var notebook = RunKit.createNotebook({
      element: target,
      source: sourceCode,
      mode: isEndpoint && 'endpoint',
      title: snippet.title,
      preamble: snippet.preamble,
      onLoad: function onLoad(e) {
        target.style = 'display:block;overflow:hidden';
        source.parentNode.parentNode.removeChild(source.parentNode);
      },
    });
    target.style = 'display:none';
    source.parentNode.parentNode.insertBefore(target, source.parentNode);
  };
  source.parentNode.appendChild(a);
});
