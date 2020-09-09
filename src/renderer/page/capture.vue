<template>
    <div id="capture" ref="capture">
        <div id="mask" class="mask"></div>
        <div id="capture-desktop" class="bg" :style="{ backgroundImage: 'url(' + this.currWin.bgPath + ')' }"></div>
        <canvas id="capture-desktop-canvas" class="bg"></canvas>
    </div>
</template>

<script>
const { ipcRenderer, remote, globalShortcut } = require('electron')
export default {
  name: "capture",
  data() {
    return {
      currWin: {
        width: 0,
        height: 0,
        scaleFactor: 0,
        bgPath: '',
        id: 0
      }
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
    }
  },
  created() {
    // 初始化当前窗口的信息
    const currWin = this.getCurrentWindow()
    this.currWin.width = currWin.bounds.width
    this.currWin.height = currWin.bounds.height
    this.currWin.id = currWin.id
    this.currWin.scaleFactor = currWin.scaleFactor
    ipcRenderer.on('SCREENSHOT::OPEN', (e, selectSource, imgSrc) => {
      this.win.show()
      this.currWin.bgPath = imgSrc
      this.startCaptureCurrentWin(selectSource, imgSrc)
    })
  },
  mounted() {
    this.win.on('show', () => {
      globalShortcut.register('Esc', () => {
        this.currWin.bgPath = ''
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      })
    })
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        console.log('start capturing')
      }
    })
  },
  methods: {
    getCurrentWindow() {
      const win = remote.getCurrentWindow()
      const wins = remote.screen.getAllDisplays()
      return wins.filter((d) => d.bounds.x === win.getBounds().x && d.bounds.y === win.getBounds().y)[0]
    },
    startCaptureCurrentWin(selectSource, imgSrc) {
      // 从主进程传来的thumbnail会丢失
      const ctx = this.canvas.getContext('2d')
      this.canvas.width = this.currWin.width * this.currWin.scaleFactor
      this.canvas.height = this.currWin.height * this.currWin.scaleFactor
      ctx.scale(this.currWin.scaleFactor, this.currWin.scaleFactor)
      this.canvas.style.width = this.currWin.width + 'px'
      this.canvas.style.height = this.currWin.height + 'px'
      let img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        ctx.drawImage(img, 0, 0)
        img.onload = null
        img = null
      }
      img.src = imgSrc
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
    }

    .mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        z-index: 1;
    }
    .bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
</style>
