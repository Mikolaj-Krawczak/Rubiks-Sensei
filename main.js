const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');

let win;

function createWindow(page) {
    win = new BrowserWindow({
        width: 1440,
        height: 1024,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets', 'logo.ico')
    });

    win.loadFile(path.join(__dirname, 'pages', page));
}

app.whenReady().then(() => {
    createWindow('home.html');
});

ipcMain.on('navigate', (event, page) => {
    win.loadFile(path.join(__dirname, 'pages', page));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow('home.html');
    }
});