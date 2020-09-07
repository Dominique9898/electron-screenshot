<template>
    <div>
        <button @click="startCapture">start capture</button>
    </div>
</template>

<script>
const { ipcRenderer } = require('electron')
export default {
  name: "index",
  methods: {
    startCapture() {
      ipcRenderer.send('SCREENSHOT::START')
    }
  }
}
</script>

<style scoped>

</style>
