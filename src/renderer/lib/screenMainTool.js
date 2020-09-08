import { BrowserWindow, globalShortcut, ipcMain, remote } from "electron";
var EventEmitter = require('events').EventEmitter;

let captureWins = []
const os = require('os')
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const captureURL = winURL + '#capture'
export default {
  getCurrentWindow() {
    const wins = remote.screen.getAllDisplays()
    return wins.filter((d) => d.bounds.x === win.getBounds().x && d.bounds.y === win.getBounds().y)[0]
  },
  captureWin() {
    if (captureWins.length) {
      return
    }
    const { screen } = require('electron')

    let displays = screen.getAllDisplays()
    captureWins = displays.map((display) => {
      let captureWin = new BrowserWindow({
        width: display.bounds.width,
        height: display.bounds.height,
        x: display.bounds.x,
        y: display.bounds.y,
        webPreferences: {
          nodeIntegration: true,
          webviewTag: true,
          webSecurity: process.env.NODE_ENV === 'production'
        },
        fullscreen: os.platform() === 'win32' || undefined,
        resizable: false,
        enableLargerThanScreen: true,
        skipTaskbar: true,
        frame: false,
        transparent: true,
        show: false,
        focusable: true,
        alwaysOnTop: true
      })
      captureWin.setAlwaysOnTop(true, 'screen-saver')
      captureWin.setVisibleOnAllWorkspaces(true)
      captureWin.setFullScreenable(true)
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
      // 主进程调用 desktopCapture, process._linkedBinding这里面内置了很多的内部对象
      captureWins.forEach(win => {
        let desktopCapture = require('process').electronBinding('desktop_capturer').createDesktopCapturer()
        const stopRunning = () => {
          if (desktopCapture) {
            desktopCapture.emit = null
            desktopCapture = null
          }
        }
        const emitter = new EventEmitter()
        emitter.once(
          'finished',
          (event, sources, fetchWindowIcons) => {
            const wins = screen.getAllDisplays()
            const _win = wins.filter((d) => d.bounds.x === win.getBounds().x && d.bounds.y === win.getBounds().y)[0]
            const selectSource = sources.filter(source => source.display_id + '' === _win.id + '')[0]
            console.log('selectSource', selectSource)
            win.webContents.send('SCREENSHOT::OPEN', selectSource, selectSource.thumbnail.toDataURL())
            stopRunning()
          }
        )
        desktopCapture.emit = emitter.emit.bind(emitter)
        desktopCapture.startHandling(
          false,
          true,
          { width: win.getBounds().width, height: win.getBounds().height },
          true
        )
        win.show()
      })
    })
  }
}
