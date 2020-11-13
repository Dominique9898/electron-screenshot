import { dateFormat, findInLocal } from './util/tool'
import { Arrow, Curve, Ellipse, Mosaic, Rectangle, Shapes, Text } from './util/shape'
import { ipcRenderer, remote, desktopCapturer, clipboard, nativeImage } from 'electron'
import fs from 'fs'
import os from 'os'
export default {
  name: 'capture',
  data() {
    return {
      strokeStyle: 'red',
      lineWidth: 5,
      curShape: {},
      shapes: {},
      currWin: {
        width: 0,
        height: 0,
        scaleFactor: 0,
        bgPath: '',
        id: 0
      },
      mouseStatus: {
        down: false,
        up: false,
        move: false
      },
      // 调整大小的箭头状态
      resizeAnchors: {
        isResizing: false,
        selectAnchor: {},
        selectIndex: 0
      },
      radius: 3,
      // 文字字体大小选择
      showFontSizeOptions: false,
      defaultFontSize: 22,
      // 涂鸦选择工具条
      customBar: {
        showCustomBar: false,
        customBarLeft: 0,
        customBarTop: 0,
        customBarRetangeMargin: 20,
        isSizeItemDefauleSelected: true
      },
      // 截图工具条
      toolbar: {
        top: 0,
        left: 0,
        showToolbar: false
      },
      iconSelected: {
        rect: false,
        ellipse: false,
        curve: false,
        arrow: false,
        mosaic: false,
        text: false
      },
      icon: {
        arrow: './static/image/capture/ico_arrow@2x.png',
        arrowSelected: './static/image/capture/ico_arrow_selected@2x.png',
        ellipse: './static/image/capture/ico_ellipse@2x.png',
        ellipseSelected: './static/image/capture/ico_ellipse_selected@2x.png',
        rectangle: './static/image/capture/ico_rectangle@2x.png',
        rectangleSelected: './static/image/capture/ico_rectangle_selected@2x.png',
        mosaic: './static/image/capture/ico_mosaic@2x.png',
        mosaicSelected: './static/image/capture/ico_mosaic_selected@2x.png',
        undoDisable: './static/image/capture/ico_undo_disabled@2x.png',
        undo: './static/image/capture/ico_undo@2x.png',
        curve: './static/image/capture/ico_curve@2x.png',
        curveSelected: './static/image/capture/ico_curve_selected@2x.png',
        text: './static/image/capture/ico_text@2x.png',
        textSelected: './static/image/capture/ico_text_selected@2x.png',
        save: './static/image/capture/ico_save@2x.png',
        close: './static/image/capture/ico_cancel@2x.png',
        done: './static/image/capture/ico_done@2x.png'
      },
      status: {
        disable: true, // 可拉取选框
        movable: false, // 移动模式
        drawing: false // 画图模式
      },
      canUndo: false,
      selectRect: {
        startX: 0,
        startY: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      tmpRect: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      },
      moveConfig: {
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
      },
      options: {}, // 控制马赛克和文字功能的显示
      fileprefix: '',
      mosaicPicBase64: '',
      isMosaicMode: false,
      isDrawing: false // 控制画图状态的resize圆点
    }
  },
  computed: {
    win() {
      return remote.getCurrentWindow()
    },
    canvas() {
      return document.getElementById('capture-desktop-canvas')
    },
    ctx() {
      return document.getElementById('capture-desktop-canvas').getContext('2d')
    },
    assCanvas() {
      return document.getElementById('assistant-canvas')
    },
    assCtx() {
      return document.getElementById('assistant-canvas').getContext('2d')
    },
    capturePadding() {
      return process.platform !== 'darwin' ? 25 : 0
    },
    captureHeightMargin() {
      return process.platform !== 'darwin' ? 1 : 0
    }
  },
  mounted() {
    this.initListern()
  },
  methods: {
    initCanvas() {
      // 3. canvas的格式化
      this.canvas.style.width = this.currWin.width + 'px'
      this.canvas.style.height = this.currWin.height + 'px'
      this.canvas.width = this.currWin.width * this.currWin.scaleFactor
      this.canvas.height = this.currWin.height * this.currWin.scaleFactor
      this.ctx.scale(this.currWin.scaleFactor, this.currWin.scaleFactor)
    },
    initListern() {
      // 1. 初始渲染进程通讯.
      ipcRenderer.on('SCREENSHOT::OPEN_Linux', (e, options) => {
        // nothing
        this.shapes = new Shapes()
        this.currWin.width = this.win.getBounds().width
        this.currWin.height = this.win.getBounds().height
        this.currWin.scaleFactor = window.devicePixelRatio || 1
        this.options = options.tools
        this.fileprefix = options.fileprefix
        this.takeScreenShotForLinux().then((imgSrc) => {
          this.currWin.bgPath = imgSrc
          this.initCanvas()
          // 2. 鼠标事件监听
          document.addEventListener('mousedown', this.onMouseDown)
          document.addEventListener('mouseup', this.onMouseUp)
          document.addEventListener('mousemove', this.onMouseMove)
          this.win.show()
        })
      })
      ipcRenderer.on('SCREENSHOT::OPEN_MAC', (e, w, h, scaleFactor, screenshotName, options) => {
        this.shapes = new Shapes()
        this.currWin.width = w
        this.currWin.height = h
        this.currWin.scaleFactor = scaleFactor
        this.currWin.bgPath = findInLocal(require('os').homedir() + `/Desktop/` + screenshotName + '.png')
        this.options = options.tools
        this.fileprefix = options.fileprefix
        this.initCanvas()
        // 2. 鼠标事件监听
        document.addEventListener('mousedown', this.onMouseDown)
        document.addEventListener('mouseup', this.onMouseUp)
        document.addEventListener('mousemove', this.onMouseMove)
        this.win.show()
      })
    },
    takeScreenShotForLinux() {
      const wins = remote.screen.getAllDisplays()
      console.log('wins', wins)
      const _win = wins[0] // 获取当前的屏幕信息
      const currentWidth = this.currWin.width
      const currentHeight = this.currWin.height
      const ratio = _win.scaleFactor || 1
      console.log('_win', _win, 'ratio', _win.scaleFactor)
      return new Promise((resolve, reject) => {
        desktopCapturer.getSources(
          {
            types: ['screen'],
            thumbnailSize: {
              width: currentWidth * ratio,
              height: currentHeight * ratio
            }
          },
          function (err, sources) {
            if (err) reject(err)
            resolve(sources[0].thumbnail.toDataURL())
          }
        )
      })
    },
    drawCircles(w, h, x, y) {
      let circles = [
        [0, 0],
        [w / 2, 0],
        [w, 0],

        [0, h / 2],
        [w, h / 2],

        [0, h],
        [w / 2, h],
        [w, h]
      ]
      circles = circles.map(([cx, cy]) => {
        return [cx + x, cy + y]
      })
      this.ctx.fillStyle = 'white'
      this.ctx.strokeStyle = 'black'
      this.ctx.lineWidth = 1
      circles.forEach((circle) => {
        this.ctx.beginPath()
        this.ctx.arc(circle[0], circle[1], 3, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.stroke()
      })
    },
    drawSelect(rect) {
      // 绘制选中框
      let img = new Image()
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight)
        this.ctx.drawImage(
          img,
          rect.x * this.currWin.scaleFactor,
          rect.y * this.currWin.scaleFactor,
          rect.width * this.currWin.scaleFactor,
          rect.height * this.currWin.scaleFactor,
          rect.x,
          rect.y,
          rect.width,
          rect.height
        )
        this.ctx.strokeStyle = '#67bade'
        this.ctx.lineWidth = this.currWin.scaleFactor
        this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height) // 画边框
        if (this.status.movable) this.drawCircles(rect.width, rect.height, rect.x, rect.y)
        img.onload = null
        img = null
      }
      img.src = this.currWin.bgPath
    },
    onMouseDown(e) {
      // w.which 1 left 2 middle 3 right\
      if (e.which !== 1) return
      if (this.status.disable) {
        // 拉取选框
        this.mouseStatus.down = true
        this.mouseStatus.up = false
        this.selectRect.startX = e.clientX
        this.selectRect.startY = e.clientY
      } else if (!this.isEmptyObject(this.curShape) && this.isInArea(e)) {
        // 涂鸦
        this.status.movable = false
        this.mouseStatus.down = true
        this.mouseStatus.up = false
        this.curShape.start(e.clientX - this.selectRect.x, e.clientY - this.selectRect.y)
        if (this.curShape.type !== 'text') {
          this.recordEvents()
        } else {
          this.curShape.draw(this.shapes.shapes)
        }
      } else if (this.status.movable) {
        // 移动选框, 调整选框的大小
        const selectAnchor = this.resizeAnchors.selectAnchor
        if (!this.isInArea(e) && this.isEmptyObject(selectAnchor)) return
        this.mouseStatus.down = true
        this.mouseStatus.up = false
        this.moveConfig.startX = e.clientX
        this.moveConfig.startY = e.clientY
      }
    },
    onMouseMove(e) {
      if (this.mouseStatus.down && !this.mouseStatus.up) {
        if (this.status.disable) {
          this.drawSelect({
            x: this.selectRect.startX,
            y: this.selectRect.startY,
            width: e.clientX - this.selectRect.startX,
            height: e.clientY - this.selectRect.startY
          })
        } else if (!this.isEmptyObject(this.curShape) && this.curShape.isDrawing) {
          this.curShape.endX = e.clientX - this.selectRect.x
          this.curShape.endY = e.clientY - this.selectRect.y
          if (this.curShape.type !== 'text') {
            this.curShape.draw(this.shapes.shapes) // 传入shapes记录
          }
        } else if (this.status.movable) {
          this.toolbar.showToolbar = false
          // resize选框
          const selectAnchor = this.resizeAnchors.selectAnchor
          this.resetTempRect()
          if (this.isEmptyObject(selectAnchor)) {
            // 移动选框
            this.tmpRect.x += e.clientX - this.moveConfig.startX
            this.tmpRect.y += e.clientY - this.moveConfig.startY
          } else {
            // 调节选框大小
            const { row, col } = this.resizeAnchors.selectAnchor
            if (row && row === 'lx') {
              this.tmpRect.x += e.clientX - this.moveConfig.startX
              this.tmpRect.width -= e.clientX - this.moveConfig.startX
            } else if (row && row === 'rx') {
              this.tmpRect.width += e.clientX - this.moveConfig.startX
            }
            if (col && col === 'ty') {
              this.tmpRect.y += e.clientY - this.moveConfig.startY
              this.tmpRect.height -= e.clientY - this.moveConfig.startY
            } else if (col && col === 'by') {
              this.tmpRect.height += e.clientY - this.moveConfig.startY
            }
          }
          this.formatSize(this.tmpRect) // 对超出边界的位置做处理
          this.drawSelect(this.tmpRect) // 画选框位置内的图片
          this.setAssistCanvas(this.tmpRect) // 设置辅助canvas
        }
      } else {
        this.changeCurcorToAnchor(e) // 当鼠标移动到resize点的时候改变cursor
      }
    },
    onMouseUp(e) {
      if (this.mouseStatus.down) {
        if (this.status.disable) {
          // 画框图
          this.mouseStatus.down = false
          this.mouseStatus.up = true
          this.selectRect.width = Math.abs(e.clientX - this.selectRect.startX)
          this.selectRect.height = Math.abs(e.clientY - this.selectRect.startY)
          this.selectRect.x = Math.min(this.selectRect.startX, e.clientX)
          this.selectRect.y = Math.min(this.selectRect.startY, e.clientY)
          this.configToolBarPosition()
          this.status.disable = false
          this.status.movable = true
          this.$nextTick(() => {
            this.setAssistCanvas(this.selectRect)
          })
          this.drawCircles(this.selectRect.width, this.selectRect.height, this.selectRect.x, this.selectRect.y) // 画圆点
        } else if (!this.isEmptyObject(this.curShape) && this.curShape.isDrawing) {
          // 画标记
          this.curShape.endX = e.clientX - this.selectRect.x
          this.curShape.endY = e.clientY - this.selectRect.y
          this.mouseStatus.down = false
          this.mouseStatus.up = true
          this.curShape.reset()
          if (!this.canUndo) {
            this.canUndo = true
          }
        } else if (this.status.movable) {
          this.mouseStatus.down = false
          this.mouseStatus.up = true
          this.selectRect = {
            x: this.tmpRect.x,
            y: this.tmpRect.y,
            width: this.tmpRect.width,
            height: this.tmpRect.height
          }
          this.configToolBarPosition()
        }
      }
    },
    resetTempRect() {
      this.tmpRect = {
        x: this.selectRect.x,
        y: this.selectRect.y,
        width: this.selectRect.width,
        height: this.selectRect.height
      }
    },
    setFontSizeOptions(bool) {
      this.showFontSizeOptions = bool
    },
    recordEvents() {
      // mosaic capture-desktop-canvas, // 其他画在assist-canvas
      let currentData
      if (this.curShape.type === 'mosaic') {
        currentData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      } else {
        currentData = this.assCtx.getImageData(0, 0, this.assCanvas.width, this.assCanvas.height)
      }
      this.shapes.push({
        type: this.curShape.type,
        data: currentData,
        shape: this.curShape
      })
    },
    setAssistCanvas(obj) {
      this.assCanvas.style.left = obj.x + 'px'
      this.assCanvas.style.top = obj.y + 'px'
      this.assCanvas.style.width = obj.width + 'px'
      this.assCanvas.style.height = obj.height + 'px'
      this.assCanvas.width = obj.width * this.currWin.scaleFactor
      this.assCanvas.height = obj.height * this.currWin.scaleFactor
    },
    isInArea(e) {
      return (
        e.clientX >= this.selectRect.x &&
        this.selectRect.x + this.selectRect.width >= e.clientX &&
        e.clientY >= this.selectRect.y &&
        this.selectRect.y + this.selectRect.height >= e.clientY
      )
    },
    clone(targetObj) {
      var targetProto = Object.getPrototypeOf(targetObj)
      return Object.assign(Object.create(targetProto), targetObj)
    },
    changeCurcorToAnchor(e) {
      if (!this.status.disable && this.isEmptyObject(this.curShape)) {
        const [x, y, w, h] = [e.clientX, e.clientY, this.selectRect.width, this.selectRect.height]
        const ANCHORS = [
          { row: 'lx', col: 'ty', cursor: 'nwse-resize' },
          { row: '', col: 'ty', cursor: 'ns-resize' },
          { row: 'rx', col: 'ty', cursor: 'nesw-resize' },

          { row: 'lx', col: '', cursor: 'ew-resize' },
          { row: 'rx', col: '', cursor: 'ew-resize' },

          { row: 'lx', col: 'by', cursor: 'nesw-resize' },
          { row: '', col: 'by', cursor: 'ns-resize' },
          { row: 'rx', col: 'by', cursor: 'nwse-resize' }
        ]
        let circles = [
          [0, 0],
          [w / 2, 0],
          [w, 0],

          [0, h / 2],
          [w, h / 2],

          [0, h],
          [w / 2, h],
          [w, h]
        ]
        circles = circles.map(([cx, cy]) => {
          cx += this.selectRect.x
          cy += this.selectRect.y
          return [cx, cy]
        })
        this.resizeAnchors = {
          selectAnchor: {},
          selectIndex: 0
        }
        circles.forEach((circle, index) => {
          if (Math.abs(x - circle[0]) <= 6 && Math.abs(y - circle[1]) <= 6) {
            this.resizeAnchors.selectAnchor = ANCHORS[index]
            this.resizeAnchors.selectIndex = index
          }
        })
        if (this.resizeAnchors.selectAnchor && Object.keys(this.resizeAnchors.selectAnchor).length) {
          document.body.style.cursor = this.resizeAnchors.selectAnchor.cursor
        } else {
          document.body.style.cursor = 'default'
        }
      }
    },
    formatSize(rect) {
      rect.x =
        rect.x <= 0 || rect.x + rect.width >= this.currWin.width
          ? rect.x <= 0
          ? 0
          : this.currWin.width - rect.width
          : rect.x
      rect.y =
        rect.y <= 0 || rect.y + rect.height >= this.currWin.height
          ? rect.y <= 0
          ? 0
          : this.currWin.height - rect.height
          : rect.y
    },
    resetIconSelected() {
      if (this.iconSelected.text) {
        this.$nextTick(() => {
          this.assCanvas.removeEventListener('mousedown', this.onMouseDown)
          document.addEventListener('mousedown', this.onMouseDown)
        })
        const textHelper = document.getElementById('textHelper')
        if (textHelper && textHelper.innerText.length > 0) {
          this.curShape.draw(this.shapes.shapes)
        } else if (textHelper && textHelper.innerText === '') {
          textHelper.style.display = 'none'
        }
      }
      // 点击画图模式时候canvas不画resize圆点,进入不可移动状态
      if (this.status.movable && !this.status.drawing) {
        this.status.movable = false
        this.status.drawing = true
        this.drawSelect({
          width: this.selectRect.width,
          height: this.selectRect.height,
          x: this.selectRect.x,
          y: this.selectRect.y
        })
      }
      this.iconSelected = {
        rect: false,
        ellipse: false,
        pen: false,
        arrow: false,
        mosaic: false,
        text: false
      }
    },
    isEmptyObject(obj) {
      return JSON.stringify(obj) === '{}'
    },
    configToolBarPosition() {
      // 默认以右下角的点 + 10px 为基准, 右下不满足放右上角, 然后左上角, 左上角的点(lx, ly), 右下角的点(rx, ry), 右下角(rx, ly)
      const [lx, ly, rx, ry, dipx] = [
        this.selectRect.x,
        this.selectRect.y,
        this.selectRect.x + this.selectRect.width,
        this.selectRect.y + this.selectRect.height,
        this.currWin.scaleFactor
      ]
      const margin = this.customBar.showCustomBar ? 50 : 0
      let capturetoolbarLen = 438
      console.log('this.options', this.options)
      const notShowObj = Object.keys(this.options).filter((key) => {
        return !this.options[key]
      })
      capturetoolbarLen = capturetoolbarLen - notShowObj.length * 38
      const rightBottomPotin = {
        x: this.selectRect.x + this.selectRect.width,
        y: this.selectRect.y + this.selectRect.height
      }
      if (Math.abs(ry - ly) === 0 || Math.abs(rx - lx) === 0) {
        // 直线
        return
      }
      // 80工具栏的高, dipx选框的边长, margin 自定义工具栏的高, 工具栏与选框的距离
      rightBottomPotin.y =
        rightBottomPotin.y + 80 + dipx > this.currWin.height
          ? rightBottomPotin.y - 40 - dipx - margin - 6
          : rightBottomPotin.y + dipx + 6
      if (rightBottomPotin.y <= 0) {
        rightBottomPotin.y = ry - 40 - dipx - margin - 6
      }
      rightBottomPotin.x = rx - capturetoolbarLen < 0 ? lx : rx - capturetoolbarLen
      this.toolbar.left = rightBottomPotin.x
      this.toolbar.top = rightBottomPotin.y
      this.toolbar.showToolbar = true
    },
    clearSizeItemSelected() {
      var sizeSelectedItemClassName = 'size_selected_item'
      var sizeSelectedItems = document.getElementsByClassName(sizeSelectedItemClassName)
      for (let index = 0; index < sizeSelectedItems.length; index++) {
        const element = sizeSelectedItems[index]
        element.classList.remove(sizeSelectedItemClassName)
      }
    },
    sizeItemClick(event, width) {
      this.clearSizeItemSelected()
      event.currentTarget.classList.add('size_selected_item')
      this.setLineWidth(width)
    },
    setCustomBarRetangeMargin(marginLeft) {
      this.customBar.customBarRetangeMargin = marginLeft
    },
    showCaptureCustomBar() {
      this.curShape.setStrokeStyle(this.strokeStyle)
      this.curShape.setLineWidth(this.lineWidth)
      this.customBar.customBarTop = this.toolbar.top + 40
      this.customBar.customBarLeft = this.toolbar.left
    },
    clearColorItemSelected() {
      var colorSelectedItemClassName = 'color_selected_item'
      var colorSelectedItems = document.getElementsByClassName(colorSelectedItemClassName)
      for (let index = 0; index < colorSelectedItems.length; index++) {
        const element = colorSelectedItems[index]
        element.classList.remove(colorSelectedItemClassName)
      }
    },
    setStrokeStyle(strokeStyle) {
      this.strokeStyle = strokeStyle
      this.curShape.setStrokeStyle(strokeStyle)
    },
    setLineWidth(lineWidth) {
      this.lineWidth = lineWidth
      this.curShape.setLineWidth(lineWidth)
    },
    colorItemClick(event, color) {
      this.clearColorItemSelected()
      this.showFontSizeOptions = false
      this.isSizeItemDefauleSelected = false
      event.currentTarget.classList.add('color_selected_item')
      if (this.curShape.type !== 'text') {
        this.setStrokeStyle(color)
      } else {
        document.getElementById('textHelper').style.color = color
      }
    },
    onFontSizeClick(size) {
      document.getElementById('textHelper').style.fontSize = size + 'px'
      this.defaultFontSize = size
      this.showFontSizeOptions = false
    },
    rectangle() {
      // 前三行有先后顺序
      this.resetIconSelected()
      this.curShape = new Rectangle(this.assCanvas, this.currWin.scaleFactor)
      this.iconSelected.rect = true
      this.setCustomBarRetangeMargin(17.5)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    ellipse() {
      // 前三行有先后顺序
      this.resetIconSelected()
      this.curShape = new Ellipse(this.assCanvas, this.currWin.scaleFactor)
      this.iconSelected.ellipse = true
      this.setCustomBarRetangeMargin(60.5)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    arrow() {
      // 前三行有先后顺序
      this.resetIconSelected()
      this.curShape = new Arrow(this.assCanvas, this.currWin.scaleFactor)
      this.iconSelected.arrow = true
      this.setCustomBarRetangeMargin(103.5)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    curve() {
      // 前三行有先后顺序
      this.resetIconSelected()
      this.curShape = new Curve(this.assCanvas, this.selectRect, this.currWin.scaleFactor)
      this.iconSelected.curve = true
      this.setCustomBarRetangeMargin(146.5)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    mosaic() {
      // 前三行有先后顺序
      this.resetIconSelected()
      this.curShape = new Mosaic(this.canvas, this.selectRect, this.currWin.scaleFactor)
      this.iconSelected.mosaic = true
      this.customBar.showCustomBar = true
      if (!this.isMosaicMode) {
        // 同一个位置只生成一次mosaic背景图片
        this.makeMosicCanvas()
        this.isMosaicMode = true
      }
      this.setCustomBarRetangeMargin(50.5)
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    text() {
      this.resetIconSelected()
      this.curShape = new Text(this.selectRect)
      this.iconSelected.text = true
      this.options.mosaic ? this.setCustomBarRetangeMargin(222.5) : this.setCustomBarRetangeMargin(184.5)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
      this.$nextTick(() => {
        document.removeEventListener('mousedown', this.onMouseDown)
        this.assCanvas.addEventListener('mousedown', this.onMouseDown)
      })
    },
    makeMosicCanvas() {
      const asscanvas = document.createElement('canvas')
      const assctx = asscanvas.getContext('2d')
      asscanvas.width = (this.selectRect.width - 2 * this.currWin.scaleFactor) * this.currWin.scaleFactor
      asscanvas.height = (this.selectRect.height - 2 * this.currWin.scaleFactor) * this.currWin.scaleFactor
      // 获取选框内的图片资源, 画马赛克原图使用
      const originImageData = this.ctx.getImageData(
        (this.selectRect.x + this.currWin.scaleFactor) * this.currWin.scaleFactor,
        (this.selectRect.y + this.currWin.scaleFactor) * this.currWin.scaleFactor,
        (this.selectRect.width - 2 * this.currWin.scaleFactor) * this.currWin.scaleFactor,
        (this.selectRect.height - 2 * this.currWin.scaleFactor) * this.currWin.scaleFactor
      ).data
      var r, g, b
      for (let y = 0; y <= asscanvas.height; y += 10 * this.currWin.scaleFactor) {
        for (let x = 0; x <= asscanvas.width; x += 10 * this.currWin.scaleFactor) {
          /*
          获取具体位置上像素点的RGB值，然后在canvas上重新绘制图片
           */
          r = originImageData[(y * asscanvas.width + x) * 4]
          g = originImageData[(y * asscanvas.width + x) * 4 + 1]
          b = originImageData[(y * asscanvas.width + x) * 4 + 2]
          /*
          在图像具体位置生成马赛克
           */
          assctx.fillStyle = `rgba(${r}, ${g}, ${b})`
          assctx.fillRect(x, y, 10 * this.currWin.scaleFactor, 10 * this.currWin.scaleFactor)
        }
      }
      this.mosaicPicBase64 = asscanvas.toDataURL('image/PNG')
    },
    onCloseItemClick() {
      ipcRenderer.send('SCREENSHOT::CLOSE')
    },
    onUndoItemClick() {
      if (this.shapes.canUndo()) {
        console.log(this.shapes.shapes)
        this.shapes.undo()
        if (!this.shapes.canUndo()) {
          this.resetIconSelected()
          this.curShape = {}
          this.mosaicPicBase64 = ''
          this.resizeAnchors = {
            selectAnchor: {},
            selectIndex: 0
          }
          this.ctx.globalCompositeOperation = 'source-over' // 不设置会清空马赛克后拖动无法画图
          this.isMosaicMode = false
          this.status.movable = true
          this.customBar.showCustomBar = false
          this.canUndo = false
          this.drawCircles(this.selectRect.width, this.selectRect.height, this.selectRect.x, this.selectRect.y)
        }
      }
    },
    onSaveItemClick() {
      this.resetIconSelected()
      const dialog = remote.dialog
      this.win.capturePage(
        {
          x: this.selectRect.x + this.currWin.scaleFactor,
          y: this.selectRect.y + this.currWin.scaleFactor,
          width: this.selectRect.width - this.currWin.scaleFactor * 2,
          height: this.selectRect.height - this.currWin.scaleFactor * 2
        },
        (image) => {
          ipcRenderer.send('SCREENSHOT::HIDE')

          const defaultDstFileName = this.fileprefix + dateFormat(new Date(), 'YYYYMMddhhmmss')

          dialog.showSaveDialog(
            {
              title: '请选择保存路径',
              defaultPath: defaultDstFileName,
              filename: defaultDstFileName,
              filters: [
                {
                  name: 'Images',
                  extensions: ['png']
                }
              ]
            },
            (path) => {
              fs.writeFile(path, image.toPNG(), () => {
                ipcRenderer.send('SCREENSHOT::CLOSE')
              })
            }
          )
        }
      )
    },
    onCheckItemClick() {
      this.resetIconSelected()
      setTimeout(() => {
        this.win.capturePage(
          {
            x: this.selectRect.x + this.currWin.scaleFactor,
            y: this.selectRect.y + this.currWin.scaleFactor,
            width: this.selectRect.width - this.currWin.scaleFactor * 2,
            height: this.selectRect.height - this.currWin.scaleFactor * 2
          },
          (image) => {
            // win.setAlwaysOnTop(true)

            var path = os.homedir() + `/Desktop`

            try {
              fs.accessSync(path)
            } catch (e) {
              fs.mkdirSync(path)
            }

            path = path + `/${this.fileprefix + '_' + new Date().getTime()}.png`
            fs.writeFile(path, image.toPNG(), async (err) => {
              if (err) throw err
              const image = nativeImage.createFromPath(path)
              clipboard.writeImage(image)
              ipcRenderer.send('SCREENSHOT::CLOSE')
            })
          }
        )
      }, 0)
    }
  }
}
