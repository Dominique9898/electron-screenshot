<template>
    <div>
        <div id="js-mask" class="mask">12313</div>
    </div>
</template>

<script>
const { ipcRenderer } = require('electron')
export default {
  name: "capture",
  created() {
    ipcRenderer.on('SCREENSHOT::OPEN', (e, data) => {
      console.log('capture created', data)
    })
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
    }
</style>
