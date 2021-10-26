var urlInput = document.getElementById('urlInput');
var webView = document.getElementById('webview')
urlInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        if (linkify.test(urlInput.value)) { // Checks if a valid HTTP / HTTPS URL is requested
            if (!urlInput.value.startsWith('https://') && !urlInput.value.startsWith('http://')) {
                urlInput.value = 'https://' + urlInput.value
            }
            webview.loadURL(urlInput.value)
            return
        }
        webview.loadURL('https://duckduckgo.com/&q=$QUERY'.replace('$QUERY', urlInput.value))
    }
})