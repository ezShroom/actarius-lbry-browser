var urlInput = document.getElementById('urlInput');
var webView = document.getElementById('webview')
urlInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        console.log(urlInput.value)
        webView.loadURL(urlInput.value)
    }
})