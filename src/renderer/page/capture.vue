<template>
    <div>
        <div id="mask" class="mask"></div>
        <div id="capture-desktop" class="bg" :style="{backgroundImage: 'url(' + this.currWin.bgPath + ')' }"></div>
    </div>
</template>

<script>
const { ipcRenderer, remote, desktopCapturer } = require('electron')
export default {
  name: "capture",
  data() {
    return {
      currWin: {
        h: 0,
        w: 0,
        scaleFactor: 0,
        bgPath: '',
        id: 0
      }
    }
  },
  created() {
    // 初始化当前窗口的信息
    const currWin = this.getCurrentWindow()
    console.log('currWin', currWin)
    this.currWin.width = currWin.bounds.width
    this.currWin.height = currWin.bounds.height
    this.currWin.id = currWin.id
    this.currWin.scaleFactor = currWin.scaleFactor
    // this.currWin.scaleFactor = window.devicePixelRatio || 1
    ipcRenderer.on('SCREENSHOT::OPEN', (e, selectSource, imgSrc) => {
      this.startCaptureCurrentWin(selectSource, imgSrc)
    })
  },
  methods: {
    getCurrentWindow() {
      const win = remote.getCurrentWindow()
      const wins = remote.screen.getAllDisplays()
      return wins.filter((d) => d.bounds.x === win.getBounds().x && d.bounds.y === win.getBounds().y)[0]
    },
    handleStream(stream) {
      console.log(stream)
    },
    startCaptureCurrentWin(selectSource, imgSrc) {
      // 从主进程传来的thumbnail会丢失
      this.currWin.bgPath = imgSrc
      const win = remote.getCurrentWindow()
      win.show()
    }
  }
}
</script>

<style scoped>
    html, body, div {
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
    .image-canvas {
        position: absolute;
        display: none;
        z-index: 1;
    }
</style>
