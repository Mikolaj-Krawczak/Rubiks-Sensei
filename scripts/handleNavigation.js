const {ipcRenderer} = require('electron');

// Funkcja do obsługi nawigacji za pomocą ipcRenderer
function openPage(page) {
    ipcRenderer.send('navigate', page);
}