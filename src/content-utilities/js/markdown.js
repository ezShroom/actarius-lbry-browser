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

    // Get Date String

    var dateArray = new Date(parseInt(findGetParameter('timestamp')) * 1000).toLocaleString('en-GB', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}).split(' ')
    dateArray[0] = dateArray[0].slice(0, -1) // Remove , from end of weekday
    switch (dateArray[1]) {
        case 1:
        case 21:
        case 31:
            dateArray[1] = dateArray[1] + '<sup>st</sup>'
            break
        case 2:
        case 22:
            dateArray[1] = dateArray[1] + '<sup>nd</sup>'
            break
        case 3:
        case 23:
            dateArray[1] = dateArray[1] + '<sup>rd</sup'
            break
        default:
            dateArray[1] = dateArray[1] + '<sup>th</sup>'
            break
    }
    console.log(dateArray.join(' '))
    document.getElementById('body').innerHTML = DOMPurify.sanitize(`<h1>${findGetParameter('title')}</h1>\n<p id="date">${dateArray.join(' ')}</p>\n${DOMPurify.sanitize(window.markdownit({html: false, breaks: true, typographer: true, linkify: false}).render(text))}`)
    document.getElementById('title').innerHTML = findGetParameter('title')
}
writeMarkdownResult()