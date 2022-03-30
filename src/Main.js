//@ts-check

const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require("path");

const { File } = require('./File.js');
const { Store } = require('./Store.js');

const isMac = process.platform === 'darwin'
const isDev = process.env.APP_DEV ? (process.env.APP_DEV.trim() == "true") : false;

const store = new Store({
    configName: 'user-preferences',
    defaults: {
        windowBounds: { width: 1000, height: 800 }
    }
});

let win;
let arprojPath;
let menu;

const template = [
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  {
    label: 'File',
    submenu: [
      {
        label: 'Open...',
        accelerator: "CmdOrCtrl+O",
        click() {
            File.select((path) => {
                arprojPath = path;
                File.open(path);
            });
        }
      },
      { type: 'separator' },
      {
        label: 'Save',
        accelerator: "CmdOrCtrl+S",
        click() {
            win.webContents.send('save')
        },
        enabled: false
      },
      {
        label: 'Save As...',
        click() {
            File.save(arprojPath, (path) => {
                arprojPath = path;
                win.webContents.send('save', path)
            })
        },
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Reload',
        accelerator: "CmdOrCtrl+R",
        click() {
            File.open(arprojPath)
        },
        enabled: false
      },
    ],
    enabled: false,
    visible: false,
  },
  {
    label: 'Dev',
    submenu: [
      { role: 'reload' },
      { role: 'forcereload' },
      { role: 'toggledevtools' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ],
    visible: isDev
  },
  {
    label: "Edit",
    submenu: [
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Join in Telegram chat',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://t.me/sparkargames')
        }
      },
      {
        label: 'Author\'s Instagram',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://instagram.com/alexeysurnin_')
        }
      }
    ]
  }
]

function createWindow () {
    let windowBounds = store.get('windowBounds');
    
    win = new BrowserWindow({
        width: windowBounds.width,
        height: windowBounds.height,
        minWidth: 605,
        minHeight: 500,
        webPreferences: {
        nodeIntegration: true,
        webSecurity: false,
        preload: path.join(__dirname, "tools/SentryLoader.js"),
        },
        title: "License Editor by Alexey Surnin v" + app.getVersion()
    })

    // @ts-ignore
    menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    win.loadFile('src/pages/index.html');

    menu
        .items
        .filter(menu => menu.label === 'File').forEach(menu => {
        menu.enabled = true;
        menu.visible = true;
        })

    Menu.setApplicationMenu(menu)

    win.on('resize', () => {
        store.set('windowBounds', win.getBounds());
    })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

ipcMain.on('select-file', () => {
    File.select((path) => {
        arprojPath = path;
        File.open(path);
    });
})

ipcMain.on('save-as', () => {
    File.save(arprojPath, (path) => {
        arprojPath = path;
        win.webContents.send('save', path)
    })
})
