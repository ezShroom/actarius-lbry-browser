function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}

async function writeMarkdownResult() {
    console.log(findGetParameter('url'))
    var response = await fetch(findGetParameter('url'))
    var text = await response.text()
    document.getElementById('body').innerHTML = DOMPurify.sanitize(marked(text))
}
writeMarkdownResult()