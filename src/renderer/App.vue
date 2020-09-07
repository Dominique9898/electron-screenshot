<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    created() {
      const url = location.href
      console.log('created', url)
    },
  }
</script>

<style>
  /* CSS */
</style>
