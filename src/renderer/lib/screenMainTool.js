import { BrowserWindow, globalShortcut, ipcMain, remote } from 'electron'
const EventEmitter = require('events').EventEmitter

let captureWins = []
const os = require('os')
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`
const captureURL = winURL + '#capture'
export default {
  useCapture() {
    globalShortcut.register('Esc', () => {
      if (captureWins) {
        captureWins.forEach(win => win.close())
        captureWins = []
      }
    })
    this.captureWin()
  },
  captureWin() {
      ipcMain.on('SCREENSHOT::START', () => {
        if (captureWins.length) {
          return
        }
        const { screen } = require('electron')

        const displays = screen.getAllDisplays()
        captureWins = displays.map((display) => {
          const captureWin = new BrowserWindow({
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
            transparent: true,
            frame: false,
            // skipTaskbar: true,
            // autoHideMenuBar: true,
            movable: false,
            resizable: false,
            enableLargerThanScreen: true,
            hasShadow: false,
          })
          captureWin.setAlwaysOnTop(true, 'screen-saver')
          captureWin.setVisibleOnAllWorkspaces(true)
          captureWin.setFullScreenable(false)
          captureWin.loadURL(captureURL)
          const { x, y } = screen.getCursorScreenPoint()
          if (
            x >= display.bounds.x &&
            x <= display.bounds.x + display.bounds.width &&
            y >= display.bounds.y &&
            y <= display.bounds.y + display.bounds.height
          ) {
            captureWin.focus()
          } else {
            captureWin.blur()
          }
          // 调试用
          captureWin.webContents.closeDevTools() // 打开dev模式会白底不会透明

          captureWin.on('closed', () => {
            let index = captureWins.indexOf(captureWin)
            if (index !== -1) {
              captureWins.splice(index, 1)
            }
            captureWins.forEach(win => win.close())
          })
          // 主进程调用 desktopCapture, process._linkedBinding这里面内置了很多的内部对象
          let desktopCapture = require('process').electronBinding('desktop_capturer').createDesktopCapturer()
          const stopRunning = () => {
            if (desktopCapture) {
              desktopCapture.emit = null
              desktopCapture = null
            }
          }
          const emitter = new EventEmitter()
          emitter.once('finished', (event, sources, fetchWindowIcons) => {
            const wins = screen.getAllDisplays()
            const _win = wins.filter((d) => d.bounds.x === captureWin.getBounds().x && d.bounds.y === captureWin.getBounds().y)[0] // 获取当前的屏幕信息
            const selectSource = sources.filter((source) => source.display_id + '' === _win.id + '')[0] // 根据_win找到在sources对应的截图
            console.log('selectSource', selectSource)
            captureWin.webContents.send('SCREENSHOT::OPEN', selectSource, selectSource.thumbnail.toDataURL())
            stopRunning()
          })
          desktopCapture.emit = emitter.emit.bind(emitter)
          desktopCapture.startHandling(
            false,
            true,
            { width: captureWin.getBounds().width, height: captureWin.getBounds().height },
            true
          )
          return captureWin
        })
    })
  }
}
