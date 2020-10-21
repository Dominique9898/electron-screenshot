<template>
    <div id="capture" ref="capture">
        <div
                id="capture-desktop"
                v-if="this.currWin.bgPath"
                :style="{ backgroundImage: 'url(' + this.currWin.bgPath + ')' }"
        ></div>
        <div id="mask" class="mask"></div>
        <canvas
         id="capture-desktop-canvas"
         :style="{
        backgroundImage: 'url(' + this.mosaicPicBase64 + ')',
        background: 'no-repeat',
        backgroundPosition:
          this.selectRect.x + this.currWin.scaleFactor + 'px ' + (this.selectRect.y + this.currWin.scaleFactor) + 'px',
        backgroundSize:
          this.selectRect.width -
          2 * this.currWin.scaleFactor +
          'px ' +
          (this.selectRect.height - 2 * this.currWin.scaleFactor) +
          'px'
      }"
        ></canvas>
        <canvas
                id="assistant-canvas"
                v-if="!this.selectRect.disable"
                :style="{
        position: 'absolute',
        width: this.selectRect.width + 'px',
        height: this.selectRect.height + 'px',
        zIndex: 3,
        cursor: !this.selectRect.movable ? 'default' : 'move'
      }"
        ></canvas>
        <div
                id="capture_toolbar"
                class="capture_toolbar"
                :style="{
        top: this.toolbar.top + 'px',
        left: this.toolbar.left + 'px',
        display: this.toolbar.showToolbar ? 'flex' : 'none'
      }"
        >
            <div class="toolbar_item_tool">
                <img
                        class="capture_toolbar_item capture_toolbar_item_rectangle"
                        :src="this.iconSelected.rect ? this.icon.rectangleSelected : this.icon.rectangle"
                        @click="rectangle"
                />
                <img
                        class="capture_toolbar_item capture_toolbar_item_ellipse"
                        :src="this.iconSelected.ellipse ? this.icon.ellipseSelected : this.icon.ellipse"
                        @click="ellipse"
                />
                <img
                        class="capture_toolbar_item capture_toolbar_item_arrow"
                        :src="this.iconSelected.arrow ? this.icon.arrowSelected : this.icon.arrow"
                        @click="arrow"
                />
                <img
                        class="capture_toolbar_item capture_toolbar_item_pen"
                        :src="this.iconSelected.curve ? this.icon.curveSelected : this.icon.curve"
                        @click="curve"
                />
                <img
                        class="capture_toolbar_item capture_toolbar_item_mosaic"
                        :src="this.iconSelected.mosaic ? this.icon.mosaicSelected : this.icon.mosaic"
                        @click="mosaic"
                />
                        <img
                          class="capture_toolbar_item capture_toolbar_item_text"
                          :src="this.iconSelected.text ? this.icon.textSelected : this.icon.text"
                          @click="text"
                        />
            </div>
            <div class="divider_line"></div>
            <div class="toolbar_item_control">
                <img
                        class="capture_toolbar_item capture_toolbar_item_undo"
                        :src="this.canUndo ? this.icon.undo : this.icon.undoDisable"
                        @click="onUndoItemClick"
                />
                <img
                        class="capture_toolbar_item capture_toolbar_item_download"
                        :src="this.icon.save"
                        @click="onSaveItemClick"
                />
            </div>
            <div class="toolbar_item_check">
                <img
                        class="capture_toolbar_item capture_toolbar_item_close"
                        :src="this.icon.cancel"
                        @click="onCloseItemClick"
                />
                <img
                        class="capture_toolbar_item capture_toolbar_item_check"
                        :src="this.icon.done"
                        @click="onCheckItemClick"
                />
            </div>
        </div>
        <div
                class="capture_custom_bar_container"
                :style="{
        top: this.customBar.customBarTop + 'px',
        left:
          curShape.type !== 'mosaic' ? this.customBar.customBarLeft + 'px' : this.customBar.customBarLeft + 140 + 'px',
        display: this.customBar.showCustomBar ? 'block' : 'none'
      }"
        >
            <div
                    class="capture_custom_bar_retange"
                    :style="{ marginLeft: this.customBar.customBarRetangeMargin + 'px' }"
            ></div>

            <div class="capture_custom_bar">
                <div class="size_board" v-if="curShape.type !== 'mosaic'">
                    <div class="size_item_min size_item" @click="sizeItemClick($event, 3)"></div>
                    <div
                            class="size_item_middle size_item"
                            :class="{ size_selected_item: this.customBar.isSizeItemDefauleSelected }"
                            @click="sizeItemClick($event, 5)"
                    ></div>
                    <div class="size_item_large size_item" @click="sizeItemClick($event, 7)"></div>
                    <div class="divider_line"></div>
                </div>
                <div class="size_board" v-if="curShape.type === 'mosaic'">
                    <div class="size_item_min size_item" @click="sizeItemClick($event, 3)"></div>
                    <div
                            class="size_item_middle size_item"
                            :class="{ size_selected_item: this.customBar.isSizeItemDefauleSelected }"
                            @click="sizeItemClick($event, 5)"
                    ></div>
                    <div class="size_item_large size_item" @click="sizeItemClick($event, 7)"></div>
                </div>

                <div class="color_board" v-if="curShape.type !== 'mosaic'">
                    <div class="color_item_red color_item" style="background: red" @click="colorItemClick($event, 'red')"></div>
                    <div
                            class="color_item_yellow color_item"
                            style="background: yellow"
                            @click="colorItemClick($event, 'yellow')"
                    ></div>
                    <div
                            class="color_item_green color_item"
                            style="background: green"
                            @click="colorItemClick($event, 'green')"
                    ></div>
                    <div
                            class="color_item_blue color_item"
                            style="background: blue"
                            @click="colorItemClick($event, 'blue')"
                    ></div>
                    <div
                            class="color_item_gray color_item"
                            style="background: gray"
                            @click="colorItemClick($event, 'gray')"
                    ></div>
                    <div
                            class="color_item_white color_item"
                            style="background: white"
                            @click="colorItemClick($event, 'white')"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

import { Arrow, Curve, Ellipse, Mosaic, Rectangle, Shapes, Text } from './captureTool'

const fs = require('fs')
const os = require('os')
const { ipcRenderer, remote, desktopCapturer, globalShortcut } = require('electron')
export default {
  name: 'captureRe',
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
      customBar: {
        showCustomBar: false,
        customBarLeft: 0,
        customBarTop: 0,
        customBarRetangeMargin: 20,
        isSizeItemDefauleSelected: true
      },
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
        arrow: 'static/image/capture/ico_arrow@2x.png',
        arrowSelected: 'static/image/capture/ico_arrow_selected@2x.png',
        ellipse: 'static/image/capture/ico_ellipse@2x.png',
        ellipseSelected: 'static/image/capture/ico_ellipse_selected@2x.png',
        rectangle: 'static/image/capture/ico_rectangle@2x.png',
        rectangleSelected: 'static/image/capture/ico_rectangle_selected@2x.png',
        mosaic: 'static/image/capture/ico_mosaic@2x.png',
        mosaicSelected: 'static/image/capture/ico_mosaic_selected@2x.png',
        undoDisable: 'static/image/capture/ico_undo_disabled@2x.png',
        undo: 'static/image/capture/ico_undo@2x.png',
        curve: 'static/image/capture/ico_curve@2x.png',
        curveSelected: 'static/image/capture/ico_curve_selected@2x.png',
        text: 'static/image/capture/ico_text@2x.png',
        textSelected: 'static/image/capture/ico_text_selected@2x.png',
        save: './static/image/capture/ico_save@2x.png',
        cancel: './static/image/capture/ico_cancel@2x.png',
        done: './static/image/capture/ico_done@2x.png',
      },
      canUndo: false,
      selectRect: {
        startX: 0,
        startY: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        disable: true,
        movable: true
      },
      moveConfig: {
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
      },
      mosaicPicBase64: '',
      isMosaicMode: false,
      historyRecord: [], // 保存涂鸦的记录
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
    }
  },
  mounted() {
    this.initListern()
  },
  methods: {
    initCanvas() {
      // 3. canvas的格式化
      console.log(this.currWin)
      this.canvas.style.width = this.currWin.width + 'px'
      this.canvas.style.height = this.currWin.height + 'px'
      this.canvas.width = this.currWin.width * this.currWin.scaleFactor
      this.canvas.height = this.currWin.height * this.currWin.scaleFactor
      this.ctx.scale(this.currWin.scaleFactor, this.currWin.scaleFactor)
    },
    initListern() {
      // 1. 初始渲染进程通讯.
      ipcRenderer.on('SCREENSHOT::OPEN_Linux', () => {
        // nothing
        this.shapes = new Shapes()
        this.currWin.width = this.win.getBounds().width
        this.currWin.height = this.win.getBounds().height
        this.currWin.scaleFactor = window.devicePixelRatio || 1
        this.takeScreenShotForLinux().then((imgSrc) => {
          this.currWin.bgPath = imgSrc
          this.initCanvas()
          // 2. 鼠标事件监听
          document.addEventListener('mousedown', this.onMouseDown)
          document.addEventListener('mouseup', this.onMouseUp)
          document.addEventListener('mousemove', (e) => {
            this.onMouseMove(e, this.drawSelect)
          })
          this.win.show()
        })
      })
      ipcRenderer.on('SCREENSHOT::OPEN_MAC', (e, w, h, scaleFactor, screenshotName) => {
        this.shapes = new Shapes()
        this.currWin.width = w
        this.currWin.height = h
        this.currWin.scaleFactor = scaleFactor
        this.currWin.bgPath = 'file://' + require('os').homedir() + `/screen_shot/` + screenshotName + '.png'

        console.log(this.currWin)
        this.initCanvas()
        // 2. 鼠标事件监听
        document.addEventListener('mousedown', this.onMouseDown)
        document.addEventListener('mouseup', this.onMouseUp)
        document.addEventListener('mousemove', (e) => {
          this.onMouseMove(e, this.drawSelect)
        })
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
            thumbnailSize: { width: currentWidth * ratio, height: currentHeight * ratio }
          },
          function (err, sources) {
            if (err) reject(err)
            resolve(sources[0].thumbnail.toDataURL())
          }
        )
      })
    },
    recordAndClearEvents() {
      // mosaic capture-desktop-canvas, // 其他画在assist-canvas
      let currentData
      if (this.curShape.type === 'mosaic') {
        currentData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      } else {
        currentData = this.assCtx.getImageData(0, 0, this.assCanvas.width, this.assCanvas.height)
      }
      this.historyRecord.push({
        type: this.curShape.type,
        data: currentData
      })
    },
    drawSelect(rect) {
      this.ctx.strokeStyle = '#67bade'
      this.ctx.lineWidth = this.currWin.scaleFactor
      // 绘制选中框
      let img = new Image()
      img.onload = () => {
        this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight)
        this.ctx.drawImage(
          img,
          rect.sx * this.currWin.scaleFactor,
          rect.sy * this.currWin.scaleFactor,
          rect.width * this.currWin.scaleFactor,
          rect.height * this.currWin.scaleFactor,
          rect.sx,
          rect.sy,
          rect.width,
          rect.height
        )
        this.ctx.strokeRect(rect.sx, rect.sy, rect.width, rect.height) // 画边框
        img.onload = null
        img = null
      }
      img.src = this.currWin.bgPath
    },
    onMouseDown(e) {
      // w.which 1 left 2 middle 3 right\
      if (e.which === 1) {
        if (this.selectRect.disable) {
          this.mouseStatus.down = true
          this.mouseStatus.up = false
          this.toolbar = {
            top: 0,
            left: 0,
            showToolbar: false
          }
          this.selectRect.startX = e.clientX
          this.selectRect.startY = e.clientY
        } else if (!this.isEmptyObject(this.curShape)) {
          this.selectRect.movable = false
          this.mouseStatus.down = true
          this.mouseStatus.up = false
          this.curShape.start(e.offsetX, e.offsetY)
          if (this.curShape.type !== 'text') {
            this.recordAndClearEvents()
          } else {
            this.curShape.draw(this.historyRecord)
          }
        } else if (this.selectRect.movable) {
          this.mouseStatus.down = true
          this.mouseStatus.up = false
          this.moveConfig.startX = e.clientX
          this.moveConfig.startY = e.clientY
        }
      }
    },
    onMouseMove(e, callback) {
      if (this.mouseStatus.down && !this.mouseStatus.up) {
        if (this.selectRect.disable) {
          const rect = {
            sx: this.selectRect.startX,
            sy: this.selectRect.startY,
            width: e.clientX - this.selectRect.startX,
            height: e.clientY - this.selectRect.startY
          }
          callback(rect)
        } else if (!this.isEmptyObject(this.curShape) && this.curShape.isDrawing) {
          if (this.curShape.type !== 'text') {
            this.curShape.endX = e.clientX - this.selectRect.x
            this.curShape.endY = e.clientY - this.selectRect.y
            this.curShape.draw(this.historyRecord)
          }
        } else if (this.selectRect.movable) {
          this.toolbar.showToolbar = false
          console.log('move', e)
          const rect = {
            sx: this.selectRect.x + (e.clientX - this.moveConfig.startX),
            sy: this.selectRect.y + (e.clientY - this.moveConfig.startY),
            width: this.selectRect.width,
            height: this.selectRect.height
          }
          rect.sx =
            rect.sx <= 0 || rect.sx + rect.width >= this.currWin.width
              ? rect.sx <= 0
              ? 0
              : this.currWin.width - rect.width
              : rect.sx
          rect.sy =
            rect.sy <= 0 || rect.sy + rect.height >= this.currWin.height
              ? rect.sy <= 0
              ? 0
              : this.currWin.height - rect.height
              : rect.sy
          this.drawSelect(rect)
          this.$nextTick(() => {
            this.assCanvas.style.left = rect.sx + 'px'
            this.assCanvas.style.top = rect.sy + 'px'
          })
        }
      }
    },
    onMouseUp(e) {
      if (this.mouseStatus.down) {
        if (this.selectRect.disable) {
          // 画框图
          this.mouseStatus.down = false
          this.mouseStatus.up = true
          this.selectRect.width = Math.abs(e.clientX - this.selectRect.startX)
          this.selectRect.height = Math.abs(e.clientY - this.selectRect.startY)
          this.selectRect.x = Math.min(this.selectRect.startX, e.clientX)
          this.selectRect.y = Math.min(this.selectRect.startY, e.clientY)
          this.configToolBarPosition()
          document.removeEventListener('mousedown', this.onMouseDown)
          const that = this
          this.$nextTick(() => {
            if (that.assCanvas) {
              that.assCanvas.addEventListener('mousedown', this.onMouseDown)
              that.assCanvas.width = this.selectRect.width * this.currWin.scaleFactor
              that.assCanvas.height = this.selectRect.height * this.currWin.scaleFactor
              that.assCanvas.style.left = this.selectRect.x + 'px'
              that.assCanvas.style.top = this.selectRect.y + 'px'
            }
          })
        } else if (!this.isEmptyObject(this.curShape) && this.curShape.isDrawing) {
          // 画标记
          this.curShape.endX = e.clientX - this.selectRect.x
          this.curShape.endY = e.clientY - this.selectRect.y
          this.mouseStatus.down = false
          this.mouseStatus.up = true
          const shapeCopy = this.clone(this.curShape)
          this.shapes.push(shapeCopy)
          this.curShape.reset()
          if (!this.canUndo) {
            this.canUndo = true
          }
        } else if (this.selectRect.movable) {
          // 选框Drag
          this.mouseStatus.down = false
          this.mouseStatus.up = true
          this.selectRect.x += e.clientX - this.moveConfig.startX
          this.selectRect.y += e.clientY - this.moveConfig.startY
          if (this.selectRect.x < 0) {
            this.selectRect.x = 0
          } else if (this.selectRect.x + this.selectRect.width > this.currWin.width) {
            this.selectRect.x = this.currWin.width - this.selectRect.width
          }
          if (this.selectRect.y < 0) {
            this.selectRect.y = 0
          } else if (this.selectRect.y + this.selectRect.height > this.currWin.height) {
            this.selectRect.y = this.currWin.height - this.selectRect.height
          }
          this.configToolBarPosition()
        }
      }
    },
    clone(targetObj) {
      var targetProto = Object.getPrototypeOf(targetObj)
      return Object.assign(Object.create(targetProto), targetObj)
    },
    resetIconSelected() {
      this.iconSelected = {
        rect: false,
        ellipse: false,
        pen: false,
        arrow: false,
        mosaic: false,
        text: false
      }
      const textHelper = document.getElementById('textHelper')
      // textHelper.style.display = 'none'
      if (textHelper.innerText) {
        this.curShape.draw(this.historyRecord)
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
      const capturetoolbarLen = 438
      // const capturetoolbarLen = 400
      const rightBottomPotin = {
        x: this.selectRect.x + this.selectRect.width,
        y: this.selectRect.y + this.selectRect.height
      }
      if (Math.abs(ry - ly) === 0 || Math.abs(rx - lx) === 0) {
        // 直线
        return
      }
      rightBottomPotin.y =
        rightBottomPotin.y + 80 + dipx > this.currWin.height
          ? rightBottomPotin.y - 40 - dipx - margin
          : rightBottomPotin.y + dipx
      if (rightBottomPotin.y <= 0) {
        rightBottomPotin.y = ry - 40 - dipx - margin
      }
      rightBottomPotin.x = rx - capturetoolbarLen < 0 ? lx : rx - capturetoolbarLen
      this.toolbar.left = rightBottomPotin.x
      this.toolbar.top = rightBottomPotin.y
      this.toolbar.showToolbar = true
      this.selectRect.disable = false
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
      this.isSizeItemDefauleSelected = false
      event.currentTarget.classList.add('color_selected_item')
      this.setStrokeStyle(color)
    },
    rectangle() {
      this.curShape = new Rectangle(this.assCanvas, this.currWin.scaleFactor)
      this.selectRect.movable = false
      this.resetIconSelected()
      this.iconSelected.rect = true
      this.setCustomBarRetangeMargin(20)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    ellipse() {
      this.curShape = new Ellipse(this.assCanvas, this.currWin.scaleFactor)
      this.selectRect.movable = false
      this.resetIconSelected()
      this.iconSelected.ellipse = true
      this.setCustomBarRetangeMargin(60)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    arrow() {
      this.selectRect.movable = false
      this.curShape = new Arrow(this.assCanvas, this.currWin.scaleFactor)
      this.resetIconSelected()
      this.iconSelected.arrow = true
      this.setCustomBarRetangeMargin(100)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    curve() {
      this.selectRect.movable = false
      this.curShape = new Curve(this.assCanvas, this.selectRect, this.currWin.scaleFactor)
      this.resetIconSelected()
      this.iconSelected.curve = true
      this.setCustomBarRetangeMargin(140)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    mosaic() {
      this.selectRect.movable = false
      this.customBar.showCustomBar = true
      this.resetIconSelected()
      this.iconSelected.mosaic = true
      this.curShape = new Mosaic(this.canvas, this.selectRect, this.currWin.scaleFactor)
      if (!this.isMosaicMode) {
        this.makeMosicCanvas()
        this.isMosaicMode = true
      }
      this.setCustomBarRetangeMargin(45)
      this.configToolBarPosition()
      this.showCaptureCustomBar()
    },
    text() {
      this.selectRect.movable = false
      this.curShape = new Text(this.selectRect)
      this.resetIconSelected()
      this.iconSelected.text = true
      this.setCustomBarRetangeMargin(220)
      this.customBar.showCustomBar = true
      this.configToolBarPosition()
      this.showCaptureCustomBar()
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
      console.log('originImageData', originImageData)
      console.log('mosaicPicBase64', this.mosaicPicBase64)
    },
    onCloseItemClick() {
      ipcRenderer.send('screenShot')
      ipcRenderer.send('SCREENSHOT::CLOSE')
    },
    onUndoItemClick() {
      console.log(this.historyRecord)
      if (this.historyRecord.length > 1) {
        const lastRecord = this.historyRecord[this.historyRecord.length - 1] // 待撤销的data
        if (lastRecord.type === 'mosaic') {
          this.ctx.putImageData(this.historyRecord[this.historyRecord.length - 1].data, 0, 0)
        }  else if (lastRecord.type === 'text') {
          const textNodes = document.getElementsByClassName('textNode')
          const lastNode = textNodes[textNodes.length - 1]
          document.getElementById('capture').removeChild(lastNode)
        } else if (lastRecord.type === 'textmove') {
          const data = lastRecord.data
          data.node.style.left = data.left + 'px'
          data.node.style.top = data.top + 'px'
        } else {
          this.assCtx.putImageData(this.historyRecord[this.historyRecord.length - 1].data, 0, 0)
        }
        this.historyRecord.pop()
      } else if (this.historyRecord.length === 1) {
        // 最后一个记录最开始的状态
        const lastRecord = this.historyRecord[0]
        if (lastRecord.type === 'mosaic') {
          this.ctx.putImageData(lastRecord.data, 0, 0)
        } else if (lastRecord.type === 'text') {
          const textNodes = document.getElementsByClassName('textNode')
          const lastNode = textNodes[textNodes.length - 1]
          document.getElementById('capture').removeChild(lastNode)
        } else if (lastRecord.type === 'textmove') {
          const data = lastRecord.data
          data.node.style.left = data.left + 'px'
          data.node.style.top = data.top + 'px'
        } else {
          this.assCtx.clearRect(0, 0, this.assCanvas.width, this.assCanvas.height)
        }
        this.historyRecord.pop()
        this.curShape = {}
        this.mosaicPicBase64 = ''
        this.ctx.globalCompositeOperation = 'source-over' // 不设置会清空马赛克后拖动无法画图
        this.isMosaicMode = false
        this.selectRect.movable = true
        this.customBar.showCustomBar = false
        this.canUndo = false
        this.resetIconSelected()
      } else {
        this.curShape = {}
        this.mosaicPicBase64 = ''
        this.ctx.globalCompositeOperation = 'source-over' // 不设置会清空马赛克后拖动无法画图
        this.isMosaicMode = false
        this.selectRect.movable = true
        this.customBar.showCustomBar = false
        this.canUndo = false
        this.resetIconSelected()
      }
    },
    onSaveItemClick() {
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

          const defaultDstFileName = '政务微信' + timetool.DateFormat(new Date(), 'YYYYMMddhhmmss')

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
                ipcRenderer.send('screenShot', '')
              })
            }
          )
        }
      )
    },
    onCheckItemClick() {
      console.log('onCheckItemClick', this.selectRect)
      this.win.capturePage(
        {
          x: this.selectRect.x + this.currWin.scaleFactor,
          y: this.selectRect.y + this.currWin.scaleFactor,
          width: this.selectRect.width - this.currWin.scaleFactor * 2,
          height: this.selectRect.height - this.currWin.scaleFactor * 2
        },
        (image) => {
          // win.setAlwaysOnTop(true)

          var path = os.homedir() + `/.wxwork_local/screen_shot`

          try {
            fs.accessSync(path)
          } catch (e) {
            fs.mkdirSync(path)
          }

          path = path + `/screen_shot_${new Date().getTime()}.png`
          fs.writeFile(path, image.toPNG(), async (err) => {
            if (err) throw err
            ipcRenderer.send('SCREENSHOT::CLOSE')
            ipcRenderer.send('screenShot', path)
          })
        }
      )
    }
  }
}
</script>

<style scoped>
    html,
    body,
    div {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        overflow: hidden;
    }

    .mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
    }
    #capture-desktop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: contain;
    }
    #capture-desktop-canvas {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
    }
    .capture_toolbar {
        position: absolute;
        color: #fff;
        box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.4);
        background: #2a2a2a;
        border-radius: 2px;
        height: 40px;
        width: fit-content;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 4;
    }
    .capture_toolbar_item {
        width: 28px;
        height: 28px;
        margin-left: 10px;
    }
    .capture_toolbar_item:last-child {
        margin-right: 10px;
    }
    .capture_custom_bar_container {
        position: absolute;
        margin-top: 5px;
        z-index: 4;
    }

    .capture_custom_bar {
        color: #fff;
        box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.4);
        background: #2a2a2a;
        border-radius: 2px;
        height: 40px;
        width: fit-content;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
    }

    .size_board,
    .color_board {
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .size_item,
    .color_item {
        width: 20px;
        height: 20px;
        margin-left: 10px;
        margin-right: 10px;
    }

    .size_item_min {
        width: 6px;
        height: 6px;
        background: white;
        border-radius: 50%;
    }

    .size_item_middle {
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
    }

    .size_item_large {
        width: 15px;
        height: 15px;
        background: white;
        border-radius: 50%;
    }

    .size_selected_item {
        background: #67bade;
    }

    .color_selected_item {
        border-width: 2px;
        border-style: solid;
        border-color: white;
    }
    .divider_line {
        width: 1px;
        height: 16px;
        display: flex;
        justify-content: center;
        background-color: grey;
    }
    .capture_custom_bar_retange {
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 5px solid #2a2a2a;
        margin-left: 20px;
    }
</style>
