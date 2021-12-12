String.prototype.replaceAll = function(search, replace) {
    if (replace === undefined) {
        return this.toString();
    }
    return this.split(search).join(replace);
}    

// Initialise some stuff
const urlInput = document.getElementById('urlInput')
const urlBar = document.getElementById('urlBar')
var currentWebview = document.getElementById('initialWebview')
const backButton = document.getElementById('arrowBack')
const reloadButton = document.getElementById('reloadButton')
const forwardButton = document.getElementById('arrowForward')
const addTabButton = document.getElementById('addTabButton')
const webContentContainer = document.getElementById('webContentContainer')
var highestTabIndex = 0

// Set up tabs library
var tabsContainer = document.querySelector('.chrome-tabs');
var chromeTabs = new ChromeTabs();
chromeTabs.init(tabsContainer, { tabOverlapDistance: 14, minWidth: 45, maxWidth: 245 });
chromeTabs.addTab({
    title: 'Home'
})

// Button listeners
backButton.addEventListener('click', (e) => {
    currentWebview.goBack()
})
forwardButton.addEventListener('click', (e) => {
    currentWebview.goForward()
})
reloadButton.addEventListener('click', (e) => {
    currentWebview.reload()
})
addTabButton.addEventListener('click', (e) => {
    highestTabIndex++
    chromeTabs.addTab({
        title: 'New Tab'
    })
})

urlBar.addEventListener('contextmenu', (e) => {
    e.preventDefault();
})
tabsContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
})

// Listeners for webview

function handleDidNavigate(event) {
    if (event.url.startsWith('file://')) return
    if (event.url.startsWith('https://cdn.lbryplayer.xyz/api/') && event.url.endsWith('?actariusDisplay=false')) return

    // URL changed and the webview is showing a different page than before

    console.log('did-navigate: ' + event.url)
    urlInput.value = event.url
}
function handleDidNavigateInPage(event) {
    if (event.url.startsWith('file://')) return

    // URL changed without redirection

    if (event.isMainFrame) {
        console.log('did-navigate-in-page: ' + event.url)
        urlInput.value = event.url
    }
}
currentWebview.addEventListener('did-navigate', handleDidNavigate)
currentWebview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)

// Listeners for tabs

tabsContainer.addEventListener('tabAdd', ({ detail }) => {
    // When a tab is added, add an ID to it in the form of the ac-tab-id attribute
    const tabElement = detail.tabEl
    tabElement.setAttribute('ac-tab-id', highestTabIndex)

    // Then, create a new webview with a matching ac-webview-id attribute
    const newWebview = document.createElement('webview')
    newWebview.setAttribute('ac-webview-id', highestTabIndex)

    // Go to the homepage (DuckDuckGo until custom new tab pages are implemented)
    newWebview.setAttribute('src', 'https://duckduckgo.com/')

    // Hide the old webview
    currentWebview.style.width = '0px'
    currentWebview.style.height = '0px'
    currentWebview.style.flex = '0 1'

    // Remove the event listeners for the old webview
    currentWebview.removeEventListener('did-navigate', handleDidNavigate)
    currentWebview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage)

    // Append the new webview to the webview container
    webContentContainer.appendChild(newWebview)

    // Set currentWebview to the new webview
    currentWebview = newWebview

    // Add event listeners for the new webview
    currentWebview.addEventListener('did-navigate', handleDidNavigate)
    currentWebview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)
})

// Listener for enter in URL bar

urlInput.addEventListener('keydown', async function (e) {
    if (e.key !== 'Enter') return

    // Handle HTTPS and HTTP

    if (linkify.test(urlInput.value)) { // Checks if a valid HTTP / HTTPS URL is requested
        if (!urlInput.value.startsWith('https://') && !urlInput.value.startsWith('http://')) { // If a URL doesn't begin with a protocol scheme, webview will treat it as an invalid URL
            urlInput.value = 'https://' + urlInput.value
        }
        currentWebview.loadURL(urlInput.value)
        return
    }

    // Handle LBRY

    if (urlInput.value.startsWith('lbry://')) {
        viewContentViaOdyseeAPI()
        return
    }

    // Handle search

    const searchURL = 'https://duckduckgo.com/?q=$QUERY&t=ffab&ia=web'.replace('$QUERY', encodeURIComponent(urlInput.value).replaceAll('%20', '+'))
    currentWebview.loadURL(searchURL)
    urlInput.value = searchURL
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
    // TODO Check through custom content utilities before defaulting to built in ones
    switch (mimeType) {
        // Switch through built-in content utilities if no custom ones are available
        case 'text/markdown':
            currentWebview.loadURL(window.pathHelper.getContentUtilityURL('markdown') + `?url=${urlResponseJSON.result.streaming_url}&title=${lookupResultsJSON.result[urlInput.value].value.title}&timestamp=${lookupResultsJSON.result[urlInput.value].timestamp}`)
            console.log(window.pathHelper.getContentUtilityURL('markdown'))
            break
        case 'text/plain':
        case 'audio/mpeg':
        case 'audio/mp3':
        case 'audio/ogg':
        case 'video/mp4':
        case 'video/m4v':
        case 'video/webm':
        case 'image/jpeg':
        case 'image/jpg':
        case 'image/png':
        case 'image/webp':
        case 'application/pdf':
           currentWebview.loadURL(urlResponseJSON.result.streaming_url + '?actariusDisplay=false')
           break
        default:
            currentWebview.loadURL(window.pathHelper.getContentUtilityURL('noContentUtility'))
    }
}