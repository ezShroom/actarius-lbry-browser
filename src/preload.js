const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('pathHelper', {
    getContentUtilityURL: function (fileType) {
        return 'file://' + __dirname + '/content-utilities/' + fileType + '.html'
    }
})