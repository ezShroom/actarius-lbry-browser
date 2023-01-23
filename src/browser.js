String.prototype.replaceAll = function(search, replace) {
    if (replace === undefined) {
        return this.toString();
    }
    return this.split(search).join(replace);
}    

// Initialise some stuff
const urlInput = document.getElementById('urlInput')
const urlBar = document.getElementById('urlBar')
var currentWebview
const backButton = document.getElementById('arrowBack')
const reloadButton = document.getElementById('reloadButton')
const forwardButton = document.getElementById('arrowForward')
const addTabButton = document.getElementById('addTabButton')
const webContentContainer = document.getElementById('webContentContainer')
var highestTabIndex = 0

// Set up tabs library
var tabsContainer = document.querySelector('.chrome-tabs');
var chromeTabs = new ChromeTabs();
chromeTabs.init(tabsContainer, { tabOverlapDistance: 14, minWidth: 45, maxWidth: 245 })

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
function handlePageFaviconUpdates(event) {
    console.log('page-favicon-updated: ' + event.favicons)

    chromeTabs.updateTab(document.querySelector(`div[ac-tab-id="${this.getAttribute('ac-webview-id')}"]`), { favicon: event.favicons[0], title: this.getTitle() })
}

// Listener for new tab

tabsContainer.addEventListener('tabAdd', ({ detail }) => {
    // When a tab is added, add an ID to it in the form of the ac-tab-id attribute
    const tabElement = detail.tabEl
    tabElement.setAttribute('ac-tab-id', highestTabIndex)

    // Then, create a new webview with a matching ac-webview-id attribute
    const newWebview = document.createElement('webview')
    newWebview.setAttribute('ac-webview-id', highestTabIndex)

    // Go to the homepage (DuckDuckGo until custom new tab pages are implemented)
    newWebview.setAttribute('src', 'https://duckduckgo.com/')

    // Check if this is the first tab - if it is, there isn't an old webview to change
    if (highestTabIndex != 0) {
        // Hide the old webview
        currentWebview.style.width = '0px'
        currentWebview.style.height = '0px'
        currentWebview.style.flex = '0 1'

        // Remove the event listeners for the old webview
        currentWebview.removeEventListener('did-navigate', handleDidNavigate)
        currentWebview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage)
    }

    // Append the new webview to the webview container
    webContentContainer.appendChild(newWebview)

    // Set currentWebview to the new webview
    currentWebview = newWebview

    // Add event listeners for the new webview
    currentWebview.addEventListener('did-navigate', handleDidNavigate)
    currentWebview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)
    currentWebview.addEventListener('page-favicon-updated', handlePageFaviconUpdates)
    currentWebview.addEventListener('new-window', (e) => console.log('new window event fired'))
})

chromeTabs.addTab({
    title: 'Home'
})

// Listener for tab switch

tabsContainer.addEventListener('activeTabChange', ({ detail }) => {
    // When a tab is switched, get the ID of the new tab
    const newTabId = detail.tabEl.getAttribute('ac-tab-id')

    // Then, get the webview with the matching ID
    const newWebview = document.querySelector(`webview[ac-webview-id="${newTabId}"]`)

    // Hide the current webview
    currentWebview.style.width = '0px'
    currentWebview.style.height = '0px'
    currentWebview.style.flex = '0 1'

    // Show the new webview
    newWebview.style.width = '100%'
    newWebview.style.height = '100%'
    newWebview.style.flex = '1 1'

    // Remove the event listeners for the old webview
    currentWebview.removeEventListener('did-navigate', handleDidNavigate)
    currentWebview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage)

    // Set currentWebview to the new webview
    currentWebview = newWebview

    // Add event listeners for the new webview
    currentWebview.addEventListener('did-navigate', handleDidNavigate)
    currentWebview.addEventListener('did-navigate-in-page', handleDidNavigateInPage)

    // Change value of URL input to the new webview's URL
    urlInput.value = currentWebview.getURL()
})

// Listener for tab close

tabsContainer.addEventListener('tabRemove', ({ detail }) => {
    // When a tab is closed, get the ID of the tab
    const tabId = detail.tabEl.getAttribute('ac-tab-id')

    // Then, get the webview with the matching ID
    const webview = document.querySelector(`webview[ac-webview-id="${tabId}"]`)

    // Remove the webview
    webview.remove()

    // If there are no more tabs, close the window
    if (document.querySelector('webview') == null) {
        window.close()
    }
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

    let resp = await fetch("https://lbry.pigg.es/$/api/get?uri=" + urlInput.value)
    resp = await resp.json()
    console.log(resp)

    
    // Handle stream_types
    switch (resp.metadata.stream_type) {
        // Switch through built-in content utilities if no custom ones are available
        case 'document':
            if (resp.metadata.source.media_type === 'text/markdown') currentWebview.loadURL(window.pathHelper.getContentUtilityURL('markdown') + `?url=${resp.streaming_url}&title=${resp.metadata.title}&timestamp=${resp.timestamp}`);
            else if (resp.metadata.source.media_type === 'text/plain') currentWebview.loadURL(window.pathHelper.getContentUtilityURL('plain') + `?url=${resp.streaming_url}&title=${resp.metadata.title}&timestamp=${resp.timestamp}`);
            break;
        case 'image':
            currentWebview.loadURL(window.pathHelper.getContentUtilityURL('image') + `?url=${resp.streaming_url}&title=${resp.metadata.title}&timestamp=${resp.timestamp}`)
            break;
        case 'video':
            currentWebview.loadURL(window.pathHelper.getContentUtilityURL('video') + `?url=${resp.streaming_url}&title=${resp.metadata.title}&timestamp=${resp.timestamp}`)
            break;
        case 'audio':
            currentWebview.loadURL(window.pathHelper.getContentUtilityURL('audio') + `?url=${resp.streaming_url}&title=${resp.metadata.title}&timestamp=${resp.timestamp}`)
            break;
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
           currentWebview.loadURL(urlResponseJSON.streaming_url + '?actariusDisplay=false')
           break
        default:
            currentWebview.loadURL(window.pathHelper.getContentUtilityURL('noContentUtility'))
    }
}

// Poll the title of all tabs, every second 

window.setInterval(() => {
    document.querySelectorAll('div[ac-tab-id]').forEach(tabEl => {
        if (typeof document.querySelector(`div[ac-tab-id="${tabEl.getAttribute('ac-tab-id')}"] div.chrome-tab-content div.chrome-tab-favicon`) === 'undefined') {
            // There's no favicon for this tab, so we'll update the tab without it
            chromeTabs.updateTab(tabEl, { title: document.querySelector(`webview[ac-webview-id="${tabEl.getAttribute('ac-tab-id')}"]`).getTitle() })
        }
        // TODO if there is a favicon, update the tab with it
        chromeTabs.updateTab(tabEl, { title: document.querySelector(`webview[ac-webview-id="${tabEl.getAttribute('ac-tab-id')}"]`).getTitle(), favicon: document.querySelector(`div[ac-tab-id="${tabEl.getAttribute('ac-tab-id')}"] div.chrome-tab-content div.chrome-tab-favicon`).getAttribute('style').split('"')[1] })
    })
}, 1000)