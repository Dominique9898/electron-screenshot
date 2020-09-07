import Vue from 'vue'
import Router from 'vue-router'
import homeIndex from "../components/homeIndex";
import capture from "../page/capture";

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: homeIndex
    },
    {
      path: '/capture',
      name: 'capture',
      component: capture
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
