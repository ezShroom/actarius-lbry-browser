const { app, BrowserView, BrowserWindow, session, ipcMain } = require('electron');
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
      		webviewTag: true,
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true
    	},
		title: 'Actarius',
		icon: __dirname + '/res/icon.png'
  	});

  	// and load the index.html of the app.
  	mainWindow.loadFile(path.join(__dirname, 'index.html'));

	mainWindow.setTitle('Actarius')

  	// Open the DevTools.
  	// mainWindow.webContents.openDevTools();

	// The browserViews array is used to keep track of all the BrowserViews. Their index is used to link them with a tab (the ac-tab-id attribute on tabs matches the index of the BrowserView in this array).
	let browserViews = [];

	// Google login doesn't behave nicely when the user agent is set to Chrome or the default Actarius user agent.
	// A Firefox user agent, for some reason, works fine. This code intercepts the user agent on each request and sets it to Firefox, tailored to the user's OS.

	var userAgent = '';
	session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
		switch (process.platform) {
			case 'darwin':
				details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12.1; rv:97.0) Gecko/20100101 Firefox/97.0'
				break
			case 'win32':
				details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 11.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0'
				break
			case 'linux':
				details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:97.0) Gecko/20100101 Firefox/97.0'
				break
		}
		callback({ cancel: false, requestHeaders: details.requestHeaders });
	});

	// When a new tab is requested, create a new BrowserView and add it to the browserViews array. Then, make it replace the current BrowserView and send the index of the new BrowserView to the renderer process.
	ipcMain.handle('new-tab', (event, windowSizeArray) => {
		const newTabIndex = browserViews.push(new BrowserView({})) - 1
		const browserView = browserViews[newTabIndex]
		// If there is a BrowserView currently displaying on the BrowserWindow, remove it and add the new one. Otherwise, just add the new one.
		if (mainWindow.getBrowserView()) mainWindow.removeBrowserView(mainWindow.getBrowserView())
		mainWindow.setBrowserView(browserView)
		browserView.setBounds({ x: 0, y: 86, width: windowSizeArray[0], height: windowSizeArray[1] - 86 })
		browserView.setAutoResize({ width: true, height: true })
		browserView.webContents.loadURL('https://www.duckduckgo.com/')

		return newTabIndex
	})
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

const contextMenu = require('electron-context-menu')

app.on("web-contents-created", (e, contents) => {
	contextMenu({
	   window: contents,
	   showSaveImageAs: true,
	   showInspectElement: true,
	   showSearchWithGoogle: false,
	   shouldShowMenu: (event, parameters) => {console.log(event);return true;},
	   prepend: (defaultActions, parameters, browserWindow) => [
		   {
			   label: 'Custom label!',
			   visible: parameters.selectionText.trim().length > 0
		   }
	   ]
	});
})

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
