'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');
const dialog = require('dialog');
const ipc = require('ipc');
// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window being garbage collected
let mainWindow;
let webContents;

function onClosed() {
	// dereference the window
	// for multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const win = new BrowserWindow({
		"width": 600,
		"height": 400,
		"transparent" : true,
		// frame: false
	});
	win.loadUrl(`file://${__dirname}/index.html`);
	win.on('closed', onClosed);

	webContents = win.webContents;

	return win;
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate-with-no-open-windows', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', () => {
	mainWindow = createMainWindow();
});

ipc.on('dirChange', ()=>{
	dialog.showOpenDialog({ properties: [ 'openDirectory' , 'multiSelections']},(paths)=>{
		webContents.send('dirChange', paths);
	});
})
