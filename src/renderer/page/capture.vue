<template>
    <div>
        <div id="mask" class="mask"></div>
        <div id="capture-desktop" class="bg"></div>
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
        bgPath: 'static/screenshot.png',
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
    ipcRenderer.on('SCREENSHOT::OPEN', () => {
      console.log('ipcRenderer..... SCREENSHOT::OPEN')
      this.startCaptureCurrentWin()
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
    startCaptureCurrentWin() {
      const bg = document.getElementById('capture-desktop')
      bg.style.backgroundSize = `${this.currWin.w}px ${this.currWin.h}px`
      desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
        let selectSource = sources.filter(source => source.display_id + '' === this.currWin.id + '')[0]
        navigator.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: selectSource.id + '',
              minWidth: 1280,
              minHeight: 720,
              maxWidth: 8000,
              maxHeight: 8000,
            },
          },
        }, (stream) => {
          this.handleStream(stream)
        }, (e) => {throw e})
      })
    }
  },
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
        background: rgba(0, 0, 0, 0.6);
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
