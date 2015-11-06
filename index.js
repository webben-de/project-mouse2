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
let optWindow;
let webContents;
let optContens;

function onClosed() {
	// win = null;
}

function createOptionWindow() {
	const optionsW = new BrowserWindow({
		width: 600,
		height: 400,
		frame: true
	});
	optionsW.loadUrl(`file://${__dirname}/option.html`);
	optionsW.on('closed', () => {
		onClosed(optWindow);
	});
	optContens = optionsW.webContents;
	return optionsW;
}

function createMainWindow() {
	const win = new BrowserWindow({
		width: 600,
		transparent: true,
		frame: false
	});
	win.loadUrl(`file://${__dirname}/index.html`);
	win.on('closed', () => {
		onClosed(mainWindow);
	});

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

ipc.on('dirChange', () => {
	dialog.showOpenDialog({properties: ['openDirectory', 'multiSelections']}, paths => {
		webContents.send('dirChange', paths);
		if (optWindow) {
			optContens.send('dirChange', paths);
		}
	});
});

ipc.on('openOptions', () => {
	if (!optWindow) {
		optWindow = createOptionWindow();
	}
});

// );
