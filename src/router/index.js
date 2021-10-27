import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)


import Index from '../view/index'

let router = new VueRouter({
  // mode: 'history',
  routes: [{
    path: '/',
    component: Index
  }]
})


export default router
