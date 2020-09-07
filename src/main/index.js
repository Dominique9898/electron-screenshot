import { app, BrowserWindow, globalShortcut } from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let captureWins = []
const os = require('os')
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const captureURL = winURL + '#capture'

function captureWin() {
  if (captureWins.length) {
    return
  }
  const { screen } = require('electron')

  let displays = screen.getAllDisplays()
  captureWins = displays.map((display) => {
    let captureWin = new BrowserWindow({
      // window 使用 fullscreen,  mac 设置为 undefined, 不可为 false
      fullscreen: os.platform() === 'win32' || undefined,
      width: display.bounds.width,
      height: display.bounds.height,
      x: display.bounds.x,
      y: display.bounds.y,
      transparent: true,
      frame: false,
      // skipTaskbar: true,
      // autoHideMenuBar: true,
      movable: false,
      resizable: false,
      enableLargerThanScreen: true,
      hasShadow: false,
      webPreferences: {
        nodeIntegration: true,
        webviewTag: true,
        webSecurity: process.env.NODE_ENV === 'production'
      }
    })
    captureWin.setAlwaysOnTop(true, 'screen-saver')
    captureWin.setVisibleOnAllWorkspaces(true)
    captureWin.setFullScreenable(false)

    captureWin.loadURL(captureURL)
    captureWin.show()
    let { x, y } = screen.getCursorScreenPoint()
    if (x >= display.bounds.x && x <= display.bounds.x + display.bounds.width && y >= display.bounds.y && y <= display.bounds.y + display.bounds.height) {
      captureWin.focus()
    } else {
      captureWin.blur()
    }
    // 调试用
    // captureWin.openDevTools()

    captureWin.on('closed', () => {
      let index = captureWins.indexOf(captureWin)
      if (index !== -1) {
        captureWins.splice(index, 1)
      }
      captureWins.forEach(win => win.close())
    })
    return captureWin
  })
  globalShortcut.register('Esc', () => {
    if (captureWins) {
      captureWins.forEach(win => win.hide())
      captureWins = []
    }
  })
}
function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      nativeWindowOpen: true,
      webviewTag: true,
      webSecurity: process.env.NODE_ENV === 'production'
    },
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  captureWin()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
