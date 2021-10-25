const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  	app.quit();
}

const createWindow = () => {
  	// Create the browser window.
  	const mainWindow = new BrowserWindow({
    	width: 800,
    	height: 600,
		autoHideMenuBar: true,
    	webPreferences: {
      		webviewTag: true
    	}
  	});

  	// and load the index.html of the app.
  	mainWindow.loadFile(path.join(__dirname, 'index.html'));

  	// Open the DevTools.
  	// mainWindow.webContents.openDevTools();
	
	var userAgent = '';
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		switch (process.platform) {
			case 'darwin':
				details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11.5; rv:90.0) Gecko/20100101 Firefox/90.0'
				break
			case 'win32':
				details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0'
				break
			case 'linux':
				details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:90.0) Gecko/20100101 Firefox/90.0'
				break
		}
		callback({ cancel: false, requestHeaders: details.requestHeaders });
	});
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  	if (process.platform !== 'darwin') {
    	app.quit();
  	}
});

app.on('activate', () => {
  	// On OS X it's common to re-create a window in the app when the
  	// dock icon is clicked and there are no other windows open.
  	if (BrowserWindow.getAllWindows().length === 0) {
    	createWindow();
  	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
