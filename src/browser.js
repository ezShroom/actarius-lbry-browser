String.prototype.replaceAll = function(search, replace) {
    if (replace === undefined) {
        return this.toString();
    }
    return this.split(search).join(replace);
}    

var urlInput = document.getElementById('urlInput')
var urlBar = document.getElementById('urlBar')
var webView = document.getElementById('webview')

webView.addEventListener('did-navigate', async (event) => {
    if (event.url.startsWith('file://')) return
    if (event.url.startsWith('https://cdn.lbryplayer.xyz/api/') && event.url.endsWith('?actariusDisplay=false')) return

    // URL changed and the webview is showing a different page than before

    console.log('did-navigate: ' + event.url)
    urlInput.value = event.url
})
webView.addEventListener('did-navigate-in-page', async (event) => {
    if (event.url.startsWith('file://')) return

    // URL changed without redirection

    if (event.isMainFrame) {
        console.log('did-navigate-in-page: ' + event.url)
        urlInput.value = event.url
    }
})

urlInput.addEventListener('keydown', async function (e) {
    if (e.key === 'Enter') {

        // Handle HTTPS and HTTP

        if (linkify.test(urlInput.value)) { // Checks if a valid HTTP / HTTPS URL is requested
            if (!urlInput.value.startsWith('https://') && !urlInput.value.startsWith('http://')) { // If a URL doesn't begin with a protocol scheme, webview will treat it as an invalid URL
                urlInput.value = 'https://' + urlInput.value
            }
            webview.loadURL(urlInput.value)
            return
        }

        // Handle LBRY

        if (urlInput.value.startsWith('lbry://')) {
            viewContentViaOdyseeAPI()
            return
        }

        // Handle search

        const searchURL = 'https://duckduckgo.com/?q=$QUERY&t=ffab&ia=web'.replace('$QUERY', encodeURIComponent(urlInput.value).replaceAll('%20', '+'))
        webview.loadURL(searchURL)
        urlInput.value = searchURL
    }
})

async function viewContentViaOdyseeAPI() {

    // Get streaming URL from Odysee backend

    var urlResponse = await fetch("https://api.na-backend.odysee.com/api/v1/proxy?m=get", {
        "credentials": "omit",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:93.0) Gecko/20100101 Firefox/93.0",
            "Accept": "*/*",
            "Accept-Language": "en-GB,en;q=0.5",
            "Content-Type": "application/json-rpc",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site"
        },
        "referrer": "https://odysee.com/",
        "body": "{\"jsonrpc\":\"2.0\",\"method\":\"get\",\"params\":{\"uri\":\"" + urlInput.value + "\",\"save_file\":false},\"id\":1635237012803}",
        "method": "POST",
        "mode": "cors"
    })
    var urlResponseJSON = await urlResponse.json()
    console.log(urlResponseJSON.result.streaming_url)

    // Get file type from Blockchain lookup

    var lookupResults = await fetch("https://api.na-backend.odysee.com/api/v1/proxy?m=resolve", {
        "credentials": "omit",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:93.0) Gecko/20100101 Firefox/93.0",
            "Accept": "*/*",
            "Accept-Language": "en-GB,en;q=0.5",
            "Content-Type": "application/json-rpc",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site"
        },
        "referrer": "https://odysee.com/",
        "body": "{\"jsonrpc\":\"2.0\",\"method\":\"resolve\",\"params\":{\"urls\":[\"" + urlInput.value + "\"]},\"id\":1635237012652}",
        "method": "POST",
        "mode": "cors"
    })
    var lookupResultsJSON = await lookupResults.json();
    console.log(lookupResultsJSON)

    // Map MIME type to content utility

    const mimeType = lookupResultsJSON.result[urlInput.value].value.source.media_type
    switch (mimeType) {
        case 'text/markdown':
            webview.loadURL(window.pathHelper.getContentUtilityURL('markdown') + `?url=${urlResponseJSON.result.streaming_url}&title=${lookupResultsJSON.result[urlInput.value].value.title}&timestamp=${lookupResultsJSON.result[urlInput.value].timestamp}`)
            console.log(window.pathHelper.getContentUtilityURL('markdown'))
            break
        case 'text/plain':
        case 'audio/mpeg':
        case 'audio/mp3':
             webview.loadURL(urlResponseJSON.result.streaming_url + '?actariusDisplay=false')
            break
        case 'audio/ogg':
        case 'video/mp4':
        case 'video/m4v':
        case 'video/webm':
        case 'image/jpeg':
        case 'image/jpg':
        case 'image/png':
        case 'image/webp':
        case 'application/pdf':
           webview.loadURL(urlResponseJSON.result.streaming_url + '?actariusDisplay=false')
           break
        default:
            webview.loadURL(window.pathHelper.getContentUtilityURL('noContentUtility'))
    }
}
