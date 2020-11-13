import {
  BrowserWindow,
  ipcMain,
  globalShortcut
} from 'electron'

let captureWins = []
let captureWinIds = []
let displays = [] // 存储所有屏幕信息
let displayHash = {} // 存储屏幕的截图文件信息
let command = 'screencapture -x '
let deletecommand = 'rm -rf '

const path = require('os').homedir() + `/Desktop/`
const captureURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${require('path').join(__dirname, '../renderer/index.html')}`

const platform = require('os').platform()
let hotKey = 'shift+option+a'
const { exec } = require('child_process')
const fs = require('fs')
let state = fs.existsSync(require('os').homedir() + `/Desktop`)
let captureView = {}


export default {
  startScreenshot,
  useCapture,
  updateShortCutKey
}
function useCapture(options) {
  captureView = options
  hotKey = captureView.globalShortCut ? captureView.globalShortCut : hotKey
  globalShortcut.register(hotKey, () => {
    if (typeof captureView.onShowByShortCut === 'function') {
      captureView.onShowByShortCut()
    }
    startScreenshot()
  })
  createCaptureWins()
  initListern()
  return captureWins
}
function updateShortCutKey(newHotKey) {
  globalShortcut.unregister(hotKey)
  hotKey = newHotKey
  globalShortcut.register(hotKey, () => {
    startScreenshot()
  })
}
function createCaptureBrowserWindow(display) {
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
    show: false,
    movable: false,
    frame: false,
    transparent: true,
    focusable: true
  })
  captureWin.setAlwaysOnTop(true, 'screen-saver')
  captureWin.setVisibleOnAllWorkspaces(true)
  captureWin.setFullScreenable(true)
  captureWin.hide()
  captureWin.loadURL(captureURL)

  captureWin.on('ready-to-show', () => {
    captureWin.hide()
  })
  captureWin.on('show', () => {
    globalShortcut.register('Esc', () => {
      reset()
    })
  })
  captureWin.on('closed', () => {
    globalShortcut.unregister('Esc')
    captureWin = null
  })
  return captureWin
}
function setScreenInfo(displays) {
  if (!state) {
    fs.mkdirSync(require('os').homedir() + `/Desktop`)
  }
  displays.forEach((display) => {
    displayHash[display.id] = display.id + '_' + new Date().getTime()
    command = command + path + displayHash[display.id] + '.png '
    deletecommand = deletecommand + path + displayHash[display.id] + '.png '
  })
  console.log('setScreenInfo', command)
}
function createCaptureWins() {
  if(captureWins.length) {
    console.log('截图窗口已存在,不重新创建')
    return
  }
  if (platform === 'darwin') {
    const { screen } = require('electron')
    displays = screen.getAllDisplays()
    setScreenInfo(displays)
    captureWins = displays.map((display) => {
      return createCaptureBrowserWindow(display)
    })
    console.log('MACOS 截图窗口初始化成功',　displays.length)
  } else {
    const { screen } = require('electron')
    const cursor = screen.getCursorScreenPoint()
    const display = screen.getDisplayNearestPoint(cursor)
    captureWins[0] = createCaptureBrowserWindow(display)
    console.log('linux 截图窗口初始化成功', display)
  }
  if (captureView.devTools) {
    captureWins.forEach((d) => {
      d.webContents.openDevTools()
    })
  } else {
    captureWins.forEach((d) => {
      d.webContents.closeDevTools()
    })
  }
  return captureWins
}
function initListern() {
  const { screen } = require('electron')
  screen.on('display-added', () => {
    console.log('display-added')
    reset()
  })
  screen.on('display-removed', () => {
    console.log('display-removed')
    reset()
  })
  ipcMain.on('SCREENSHOT::CLOSE', () => {
    reset()
  })
  ipcMain.on('SCREENSHOT::HIDE', () => {
    if (captureWins) {
      captureWins.forEach((win) => win.hide())
    }
  })
  ipcMain.on('SCREENSHOT::CREATE', () => {
    createCaptureWins()
  })
  ipcMain.on('SCREENSHOT::START', () => {
    console.log('IpcMain...... SCREENSHOT::START', captureWins.length)
    startScreenshot()
  })
  globalShortcut.register(hotKey, () => {
    startScreenshot()
  })
}

function reset() {
  if (typeof captureView.onClose === 'function') {
    captureView.onClose()
  }

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
      state = fs.existsSync(require('os').homedir() + `/Desktop`)
      createCaptureWins()
    })
  } else {
    createCaptureWins()
  }
}


function startScreenshot() {
  if (typeof captureView.onShow === 'function') {
    console.log(captureView.onShow.toString())
    captureView.onShow()
  }
  if (platform === 'darwin') {
    startMacScreenshot()
  } else {
    startLinuxScreenshot()
  }
}

function startMacScreenshot() {

  state = fs.existsSync(require('os').homedir() + `/Desktop`)
  if (!state) {
    fs.mkdirSync(require('os').homedir() + `/Desktop`)
  }
  exec(command, (error, stdout, stderr) => {
    if (error) throw error
    if (captureView.multiScreen) {
      captureWins.forEach((captureWin) => {
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
      })
    } else {
      const { screen } = require('electron')
      const cursor = screen.getCursorScreenPoint()
      const display = screen.getDisplayNearestPoint(cursor)
      const _win = captureWins.filter(
        (d) => d.getBounds().x === display.bounds.x && d.getBounds().y === display.bounds.y
      )[0] // 获取当前的屏幕信息
      _win.webContents.send(
        'SCREENSHOT::OPEN_MAC',
        display.bounds.width,
        display.bounds.height,
        display.scaleFactor,
        displayHash[display.id],
        {
          tools: captureView.tools,
          fileprefix: captureView.fileprefix
        }
      )
    }
  })
}

function startLinuxScreenshot() {
  const captureWin = captureWins[0]
  captureWin.webContents.send('SCREENSHOT::OPEN_Linux',{
    tools: captureView.tools,
    fileprefix: captureView.fileprefix
  })
}
