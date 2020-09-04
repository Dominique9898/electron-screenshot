import Vue from 'vue'
import Router from 'vue-router'
import homeIndex from "../components/homeIndex";

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: homeIndex
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
