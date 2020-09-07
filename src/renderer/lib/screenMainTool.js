import {BrowserWindow, globalShortcut, ipcMain} from "electron";

let captureWins = []
const os = require('os')
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const captureURL = winURL + '#capture'

export default {
  captureWin() {
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
      captureWin.hide()
      captureWin.loadURL(captureURL)
      let { x, y } = screen.getCursorScreenPoint()
      if (x >= display.bounds.x && x <= display.bounds.x + display.bounds.width && y >= display.bounds.y && y <= display.bounds.y + display.bounds.height) {
        captureWin.focus()
      } else {
        captureWin.blur()
      }
      // 调试用
      // captureWin.webContents.closeDevTools() // 打开dev模式会白底不会透明

      captureWin.on('closed', () => {
        let index = captureWins.indexOf(captureWin)
        if (index !== -1) {
          captureWins.splice(index, 1)
        }
        captureWins.forEach(win => win.close())
        globalShortcut.unregister('Esc', () => {
          if (captureWins) {
            captureWins.forEach(win => win.hide())
          }
        })
      })
      captureWin.on('show', () => {
        globalShortcut.register('Esc', () => {
          if (captureWins) {
            captureWins.forEach(win => win.hide())
          }
        })
      })
      return captureWin
    })
    ipcMain.on('SCREENSHOT::START', () => {
      console.log('IpcMain...... SCREENSHOT::START')
      captureWins.forEach(win => {
        win.webContents.send('SCREENSHOT::OPEN', 11)
        win.show()
      })
    })
  }
}
