const {ipcRenderer} = require('electron');

// Function to handle navigation via ipcRenderer
function openPage(page) {
    ipcRenderer.send('navigate', page);
}