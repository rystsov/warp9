function uncommentAndHighlight(element) {
    element.appendChild(document.createTextNode(element.innerHTML.slice(4,-3)));
    hljs.highlightBlock(element);
}