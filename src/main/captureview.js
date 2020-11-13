import events from "./events";
export default class captureView {

  constructor(options) {
    this.multiScreen = !!options ? !!options.multiScreen : false
    this.globalShortCut = !!options ? options.globalShortCut || 'shift+option+A' : 'shift+option+A'
    this.devTools = !!options ? !!options.devTools : false
    this.fileprefix = !! options ? options.fileprefix || 'screen_shot' : 'screen_shot'
    this.onClose = !!options ? options.onClose || null : null
    this.onShow = !!options ? options.onShow || null : null
    this.onShowByShortCut = !!options ? options.onShowByShortCut || null : null
    this.tools = {
      mosaic: !!options ? !!options.mosaic : false,
      text: !!options ? !!options.text : false,
      curve: !!options ? !!options.curve : false,
    }
    this.useCapture()
  }

  useCapture() {
    global.captureView = this
    this.captureWins = events.useCapture(this)
  }

  open() {
    events.startScreenshot()
  }

  close() {
    events.reset()
  }

  updateShortCutKey(newHotKey) {
    events.updateShortCutKey(newHotKey)
  }

  setMultiScreen(option) {
    this.multiScreen = option
  }
}
