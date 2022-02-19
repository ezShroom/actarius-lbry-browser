const { contextBridge, ipcRenderer } = require('electron')

// pathHelper - helps get file:// URLs to display in the BrowserView
contextBridge.exposeInMainWorld('pathHelper', {
    getContentUtilityURL: (fileType) => { return 'file://' + __dirname + '/content-utilities/' + fileType + '.html' }
})

// browserViewAPI - Allows browser to control certain elements of the BrowserView
contextBridge.exposeInMainWorld('browserViewAPI', {
    newTab: (windowSizeArray) => ipcRenderer.invoke('new-tab', windowSizeArray)
})