import { BrowserWindow, globalShortcut, ipcMain, remote } from 'electron'

let captureWins = []
let captureWinIds = []
let displays = [] // 存储所有屏幕信息
let displayHash = {} // 存储屏幕的截图文件信息

let command = 'screencapture -x '
let deletecommand = 'rm -rf '
const platform = require('os').platform()

const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`
const captureURL = winURL + '#capture'
const { exec } = require('child_process')
const fs = require('fs')
let state = fs.existsSync(require('os').homedir() + `/screen_shot`)
const path = require('os').homedir() + `/screen_shot/`
export default {
  useCapture() {
    this.createCaptureWins()
    console.log('platform ', platform)
    if (platform === 'darwin') {
      this.initListernMac()
    } else {
      this.initListernLinux()
    }
  },
  initListernLinux() {
    this.listenDisplayNumChange()
    ipcMain.on('SCREENSHOT::CLOSE', () => {
      this.reset()
    })
    ipcMain.on('SCREENSHOT::HIDE', () => {
      if (captureWins) {
        captureWins.forEach((win) => win.hide())
      }
    })
    ipcMain.on('SCREENSHOT::CREATE', () => {
      this.createCaptureWins()
    })
    ipcMain.on('SCREENSHOT::START', () => {
      console.log('SCREENSHOT::OPEN_Linux')
      this.startLinuxScreenshot()
    })
  },
  initListernMac() {
    this.listenDisplayNumChange()
    ipcMain.on('SCREENSHOT::CLOSE', () => {
      this.reset()
    })
    ipcMain.on('SCREENSHOT::HIDE', () => {
      if (captureWins) {
        captureWins.forEach((win) => win.hide())
      }
    })
    ipcMain.on('SCREENSHOT::CREATE', () => {
      this.createCaptureWins()
    })
    ipcMain.on('SCREENSHOT::START', () => {
      console.log('IpcMain...... SCREENSHOT::START', captureWins.length)
      this.startMacScreenshot()
    })
  },
  startScreenshot() {
    if (captureWins.length === 0) this.createCaptureWins()
    if (platform === 'darwin') {
      this.startMacScreenshot()
    } else {
      this.startLinuxScreenshot()
    }
  },
  startLinuxScreenshot() {
    const captureWin = captureWins[0]
    let _win = null
    if (displays) {
      _win = displays[0]
    } else {
      const { screen } = require('electron')
      displays = screen.getAllDisplays()
      _win = displays[0]
    }
    captureWin.webContents.send('SCREENSHOT::OPEN_Linux', {
      width: _win.bounds.width,
      height: _win.bounds.height,
      scaleFactor: _win.scaleFactor
    })
  },
  startMacScreenshot() {
    state = fs.existsSync(require('os').homedir() + `/screen_shot`)
    if (!state) {
      fs.mkdirSync(require('os').homedir() + `/screen_shot`)
    }
    exec(command, (error, stdout, stderr) => {
      if (error) throw error
      for (let i = 0; i < captureWins.length - 1; i++) {
        // 调试用
        const captureWin = captureWins[i]
        const _win = displays.filter(
          (d) => d.bounds.x === captureWin.getBounds().x && d.bounds.y === captureWin.getBounds().y
        )[0] // 获取当前的屏幕信息
        captureWin.setSize(_win.bounds.width, _win.bounds.height)
        captureWin.webContents.send(
          'SCREENSHOT::OPEN_MAC',
          _win.bounds.width,
          _win.bounds.height,
          _win.scaleFactor,
          displayHash[_win.id]
        )
      }
      // captureWins.forEach((captureWin) => {
      //   const _win = displays.filter(
      //     (d) => d.bounds.x === captureWin.getBounds().x && d.bounds.y === captureWin.getBounds().y
      //   )[0] // 获取当前的屏幕信息
      //   captureWin.setSize(_win.bounds.width, _win.bounds.height)
      //   captureWin.webContents.send(
      //     'SCREENSHOT::OPEN_MAC',
      //     _win.bounds.width,
      //     _win.bounds.height,
      //     _win.scaleFactor,
      //     displayHash[_win.id]
      //   )
      // })
    })
  },
  reset() {
    if (captureWins) {
      captureWins.forEach((win) => {
        win.close()
        win = null
      })
      displayHash = {}
      captureWins = []
      displays = []
      captureWinIds = []
    }
    if (platform === 'darwin') {
      exec(deletecommand, (error, stdout, stderr) => {
        if (error) throw error
        deletecommand = 'rm -rf '
        command = 'screencapture -x '
        state = fs.existsSync(require('os').homedir() + `/screen_shot`)
        this.createCaptureWins()
      })
    } else {
      this.createCaptureWins()
    }
  },
  listenDisplayNumChange() {
    const { screen } = require('electron')
    screen.on('display-added', () => {
      console.log('display-added')
      this.reset()
    })

    screen.on('display-removed', () => {
      console.log('display-removed')
      this.reset()
    })
  },
  setScreenInfo(displays) {
    if (!state) {
      fs.mkdirSync(require('os').homedir() + `/screen_shot`)
    }
    displays.forEach((display) => {
      displayHash[display.id] = display.id + '_' + new Date().getTime()
      command = command + path + displayHash[display.id] + '.png '
      deletecommand = deletecommand + path + displayHash[display.id] + '.png '
    })
  },
  initCaptureWinIds(displays) {
    displays.forEach((display) => {
      captureWinIds.push(display.id)
    })
  },
  createCaptureWins() {
    if (captureWins.length) {
      console.log('create captureWin failed')
      return
    }
    const { screen } = require('electron')

    displays = screen.getAllDisplays()
    this.setScreenInfo(displays)
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
        fullscreen: platform === 'win32' || undefined,
        resizable: false,
        enableLargerThanScreen: true,
        skipTaskbar: true,
        show: false, // linux 下一定要设置
        movable: false,
        frame: false,
        transparent: true,
        focusable: true
      })
      if (platform === 'darwin') {
        captureWin.setAlwaysOnTop(true, 'screen-saver')
      }
      captureWin.setVisibleOnAllWorkspaces(true)
      captureWin.setFullScreenable(true)
      captureWin.hide()
      captureWin.loadURL(captureURL)

      // 调试用
      // captureWin.webContents.closeDevTools() // 打开dev模式会白底不会透明
      captureWin.on('show', () => {
        globalShortcut.register('Esc', () => {
          this.reset()
        })
      })
      captureWin.on('closed', () => {
        globalShortcut.unregister('Esc')
        captureWin = null
      })
      return captureWin
    })
    this.initCaptureWinIds(captureWins) // 获取displays ids
    console.log('create captureWin successfully', captureWins.length)
  }
}
