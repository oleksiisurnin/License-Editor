//@ts-check

const { dialog, BrowserWindow, Menu } = require('electron');

class File {
    static select(callback) {
        dialog.showOpenDialog({
            filters: [
                {name: 'Spark AR Project', extensions: ['arproj', 'arblock', 'zip']}
            ],
            properties: ['openFile']
          }).then(result => {
            if (!result.canceled) {
                callback(result.filePaths[0]);
            }
                
          });
    }

    static save(defaultPath, callback) {
        dialog.showSaveDialog(
            BrowserWindow.getFocusedWindow(),
            {
                title: "Save file",
                buttonLabel: "Save Spark AR File",
                defaultPath: defaultPath,
                
                filters: [
                    {name: 'Spark AR Project', extensions: ['arproj', 'arblock']}
                ]
            }
        ).then(result => {
            if (!result.canceled) {
                callback(result.filePath);
            }
           })
    }

    static open(path) {
        BrowserWindow.getFocusedWindow()?.loadFile('src/pages/app.html', {query: {"path": path}});

        Menu.getApplicationMenu()
            ?.items
            .filter(menu => menu.label === 'File')[0]
            .submenu
            ?.items
            .filter(menu => menu.label === 'Save' || menu.label === 'Save As...' || menu.label === 'Reload')
            .forEach(menu => {
                menu.enabled = true;
            })
      }
}

module.exports = { File }
