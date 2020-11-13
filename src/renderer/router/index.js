import Vue from 'vue'
import Router from 'vue-router'
import capture from "../capture.vue";

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'capture',
      component: capture
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
