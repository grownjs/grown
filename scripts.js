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
    target.dataset.label = "response:";
  });
  [].slice.call(document.querySelectorAll("a>code")).forEach((node) => {
    if (!node.dataset.href)
      node.dataset.href = node.parentNode.href.replace(location.origin, "");
    node.parentNode.setAttribute("target", "external");
    node.parentNode.setAttribute("href", baseURL + node.dataset.href);
    node.parentNode.addEventListener("click", () => {
      target.dataset.label = "waiting...";
    });
  });
}
[].slice.call(document.querySelectorAll("pre code.lang-js")).forEach((source) => {
  const matches = source.innerText.match(/\/\*+\s*@runkit\s*(.+?)\s*\*+\//);
  if (!matches)
    return;
  const snippet = __runkit__[matches[1]] || __runkit__;
  const isEndpoint = snippet.endpoint;
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
    source.parentNode.parentNode.insertBefore(el, source.parentNode);
    source.parentNode.parentNode.removeChild(source.parentNode);
    const notebook = RunKit.createNotebook({
      element: el,
      source: sourceCode,
      mode: isEndpoint && "endpoint",
      title: snippet.title || "Untitled",
      preamble: snippet.preamble.contents + (isEndpoint ? "\nexports.endpoint=(req,res)=>{res.end()}" : ""),
      environment: [{name: "U_WEBSOCKETS_SKIP", value: "true"}],
      gutterStyle: "none",
      evaluateOnLoad: true,
      onURLChanged: () => notebook.getEndpointURL().then(links)
    });
  };
  source.parentNode.appendChild(a);
});
if (activeLink && activeLocation !== "/") {
  activeLink.scrollIntoView({
    block: "end"
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi93b3Jrc3BhY2VzL2dyb3duL3dlYnNpdGUvc3JjL3NjcmlwdHMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5cbmNvbnN0IGFjdGl2ZUxvY2F0aW9uID0gbG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXFwvJC8sICcnKSB8fCAnLyc7XG5jb25zdCBsaW5rU2VsZWN0b3IgPSBgI3NpZGViYXIgYVtocmVmJD1cIiR7YWN0aXZlTG9jYXRpb259XCJdYDtcbmNvbnN0IGFjdGl2ZUxpbmsgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGxpbmtTZWxlY3Rvcik7XG5cbmZ1bmN0aW9uIGxpbmtzKGJhc2VVUkwpIHtcbiAgaWYgKHR5cGVvZiB0YXJnZXQgPT09ICd1bmRlZmluZWQnKSByZXR1cm47XG5cbiAgdGFyZ2V0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB0YXJnZXQuZGF0YXNldC5sYWJlbCA9ICdyZWFkeSc7XG4gIHRhcmdldC5pbm5lckhUTUwgPSAnPGlmcmFtZSBuYW1lPVwiZXh0ZXJuYWxcIj48L2lmcmFtZT4nO1xuXG4gIHRhcmdldC5maXJzdENoaWxkLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiB7XG4gICAgdGFyZ2V0LmRhdGFzZXQubGFiZWwgPSAncmVzcG9uc2U6JztcbiAgfSk7XG5cbiAgW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhPmNvZGUnKSkuZm9yRWFjaChub2RlID0+IHtcbiAgICBpZiAoIW5vZGUuZGF0YXNldC5ocmVmKSBub2RlLmRhdGFzZXQuaHJlZiA9IG5vZGUucGFyZW50Tm9kZS5ocmVmLnJlcGxhY2UobG9jYXRpb24ub3JpZ2luLCAnJyk7XG5cbiAgICBub2RlLnBhcmVudE5vZGUuc2V0QXR0cmlidXRlKCd0YXJnZXQnLCAnZXh0ZXJuYWwnKTtcbiAgICBub2RlLnBhcmVudE5vZGUuc2V0QXR0cmlidXRlKCdocmVmJywgYmFzZVVSTCArIG5vZGUuZGF0YXNldC5ocmVmKTtcbiAgICBub2RlLnBhcmVudE5vZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICB0YXJnZXQuZGF0YXNldC5sYWJlbCA9ICd3YWl0aW5nLi4uJztcbiAgICB9KTtcbiAgfSk7XG59XG5cbltdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgncHJlIGNvZGUubGFuZy1qcycpKS5mb3JFYWNoKHNvdXJjZSA9PiB7XG4gIGNvbnN0IG1hdGNoZXMgPSBzb3VyY2UuaW5uZXJUZXh0Lm1hdGNoKC9cXC9cXCorXFxzKkBydW5raXRcXHMqKC4rPylcXHMqXFwqK1xcLy8pO1xuXG4gIGlmICghbWF0Y2hlcykgcmV0dXJuO1xuXG4gIGNvbnN0IHNuaXBwZXQgPSBfX3J1bmtpdF9fW21hdGNoZXNbMV1dIHx8IF9fcnVua2l0X187XG4gIGNvbnN0IGlzRW5kcG9pbnQgPSBzbmlwcGV0LmVuZHBvaW50O1xuICBjb25zdCBzb3VyY2VDb2RlID0gc291cmNlLmlubmVyVGV4dDtcbiAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblxuICBhLmlubmVyVGV4dCA9ICfilrogUlVOJztcbiAgYS5ocmVmID0gbG9jYXRpb24uaHJlZjtcbiAgYS5vbmNsaWNrID0gZSA9PiB7XG4gICAgaWYgKGEuX2xvY2tlZCkgcmV0dXJuO1xuXG4gICAgYS5fbG9ja2VkID0gdHJ1ZTtcbiAgICBkZWxldGUgYS5vbmNsaWNrO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICBzb3VyY2UucGFyZW50Tm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbCwgc291cmNlLnBhcmVudE5vZGUpO1xuICAgIHNvdXJjZS5wYXJlbnROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc291cmNlLnBhcmVudE5vZGUpO1xuXG4gICAgY29uc3Qgbm90ZWJvb2sgPSBSdW5LaXQuY3JlYXRlTm90ZWJvb2soe1xuICAgICAgZWxlbWVudDogZWwsXG4gICAgICBzb3VyY2U6IHNvdXJjZUNvZGUsXG4gICAgICBtb2RlOiBpc0VuZHBvaW50ICYmICdlbmRwb2ludCcsXG4gICAgICB0aXRsZTogc25pcHBldC50aXRsZSB8fCAnVW50aXRsZWQnLFxuICAgICAgcHJlYW1ibGU6IHNuaXBwZXQucHJlYW1ibGUuY29udGVudHNcbiAgICAgICAgKyAoaXNFbmRwb2ludCA/ICdcXG5leHBvcnRzLmVuZHBvaW50PShyZXEscmVzKT0+e3Jlcy5lbmQoKX0nIDogJycpLFxuICAgICAgZW52aXJvbm1lbnQ6IFt7IG5hbWU6ICdVX1dFQlNPQ0tFVFNfU0tJUCcsIHZhbHVlOiAndHJ1ZScgfV0sXG4gICAgICBndXR0ZXJTdHlsZTogJ25vbmUnLFxuICAgICAgZXZhbHVhdGVPbkxvYWQ6IHRydWUsXG4gICAgICBvblVSTENoYW5nZWQ6ICgpID0+IG5vdGVib29rLmdldEVuZHBvaW50VVJMKCkudGhlbihsaW5rcyksXG4gICAgfSk7XG4gIH07XG5cbiAgc291cmNlLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoYSk7XG59KTtcblxuaWYgKGFjdGl2ZUxpbmsgJiYgYWN0aXZlTG9jYXRpb24gIT09ICcvJykge1xuICBhY3RpdmVMaW5rLnNjcm9sbEludG9WaWV3KHtcbiAgICBibG9jazogJ2VuZCcsXG4gIH0pO1xufVxuIl0sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLGlCQUFpQixTQUFTLFNBQVMsUUFBUSxPQUFPLE9BQU87QUFDL0QsTUFBTSxlQUFlLHFCQUFxQjtBQUMxQyxNQUFNLGFBQWEsU0FBUyxjQUFjO0FBRTFDLGVBQWUsU0FBUztBQUN0QixNQUFJLE9BQU8sV0FBVztBQUFhO0FBRW5DLFNBQU8sTUFBTSxVQUFVO0FBQ3ZCLFNBQU8sUUFBUSxRQUFRO0FBQ3ZCLFNBQU8sWUFBWTtBQUVuQixTQUFPLFdBQVcsaUJBQWlCLFFBQVEsTUFBTTtBQUMvQyxXQUFPLFFBQVEsUUFBUTtBQUFBO0FBR3pCLEtBQUcsTUFBTSxLQUFLLFNBQVMsaUJBQWlCLFdBQVcsUUFBUSxVQUFRO0FBQ2pFLFFBQUksQ0FBQyxLQUFLLFFBQVE7QUFBTSxXQUFLLFFBQVEsT0FBTyxLQUFLLFdBQVcsS0FBSyxRQUFRLFNBQVMsUUFBUTtBQUUxRixTQUFLLFdBQVcsYUFBYSxVQUFVO0FBQ3ZDLFNBQUssV0FBVyxhQUFhLFFBQVEsVUFBVSxLQUFLLFFBQVE7QUFDNUQsU0FBSyxXQUFXLGlCQUFpQixTQUFTLE1BQU07QUFDOUMsYUFBTyxRQUFRLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFLN0IsR0FBRyxNQUFNLEtBQUssU0FBUyxpQkFBaUIscUJBQXFCLFFBQVEsWUFBVTtBQUM3RSxRQUFNLFVBQVUsT0FBTyxVQUFVLE1BQU07QUFFdkMsTUFBSSxDQUFDO0FBQVM7QUFFZCxRQUFNLFVBQVUsV0FBVyxRQUFRLE9BQU87QUFDMUMsUUFBTSxhQUFhLFFBQVE7QUFDM0IsUUFBTSxhQUFhLE9BQU87QUFDMUIsUUFBTSxJQUFJLFNBQVMsY0FBYztBQUVqQyxJQUFFLFlBQVk7QUFDZCxJQUFFLE9BQU8sU0FBUztBQUNsQixJQUFFLFVBQVUsT0FBSztBQUNmLFFBQUksRUFBRTtBQUFTO0FBRWYsTUFBRSxVQUFVO0FBQ1osV0FBTyxFQUFFO0FBQ1QsTUFBRTtBQUVGLFVBQU0sS0FBSyxTQUFTLGNBQWM7QUFFbEMsV0FBTyxXQUFXLFdBQVcsYUFBYSxJQUFJLE9BQU87QUFDckQsV0FBTyxXQUFXLFdBQVcsWUFBWSxPQUFPO0FBRWhELFVBQU0sV0FBVyxPQUFPLGVBQWU7QUFBQSxNQUNyQyxTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixNQUFNLGNBQWM7QUFBQSxNQUNwQixPQUFPLFFBQVEsU0FBUztBQUFBLE1BQ3hCLFVBQVUsUUFBUSxTQUFTLFdBQ3RCLGNBQWEsOENBQThDO0FBQUEsTUFDaEUsYUFBYSxDQUFDLENBQUUsTUFBTSxxQkFBcUIsT0FBTztBQUFBLE1BQ2xELGFBQWE7QUFBQSxNQUNiLGdCQUFnQjtBQUFBLE1BQ2hCLGNBQWMsTUFBTSxTQUFTLGlCQUFpQixLQUFLO0FBQUE7QUFBQTtBQUl2RCxTQUFPLFdBQVcsWUFBWTtBQUFBO0FBR2hDLElBQUksY0FBYyxtQkFBbUIsS0FBSztBQUN4QyxhQUFXLGVBQWU7QUFBQSxJQUN4QixPQUFPO0FBQUE7QUFBQTsiLCJuYW1lcyI6W119
