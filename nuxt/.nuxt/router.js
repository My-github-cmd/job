import Vue from 'vue'
import Router from 'vue-router'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _dc9f7b66 = () => interopDefault(import('..\\pages\\layout' /* webpackChunkName: "" */))
const _75e3a8c2 = () => interopDefault(import('..\\pages\\home' /* webpackChunkName: "" */))
const _46c9b7e6 = () => interopDefault(import('..\\pages\\login' /* webpackChunkName: "" */))
const _d73bb234 = () => interopDefault(import('..\\pages\\profile' /* webpackChunkName: "" */))
const _edba72f4 = () => interopDefault(import('..\\pages\\settings' /* webpackChunkName: "" */))
const _f43d2ee0 = () => interopDefault(import('..\\pages\\editor' /* webpackChunkName: "" */))
const _7b2c6a33 = () => interopDefault(import('..\\pages\\article' /* webpackChunkName: "" */))

// TODO: remove in Nuxt 3
const emptyFn = () => {}
const originalPush = Router.prototype.push
Router.prototype.push = function push (location, onComplete = emptyFn, onAbort) {
  return originalPush.call(this, location, onComplete, onAbort)
}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: decodeURI('/'),
  linkActiveClass: 'active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/",
    component: _dc9f7b66,
    children: [{
      path: "/",
      component: _75e3a8c2,
      name: "home"
    }, {
      path: "/login",
      component: _46c9b7e6,
      name: "login"
    }, {
      path: "/register",
      component: _46c9b7e6,
      name: "register"
    }, {
      path: "/profile/:username",
      component: _d73bb234,
      name: "profile"
    }, {
      path: "/settings",
      component: _edba72f4,
      name: "settings"
    }, {
      path: "/editor/:slug?",
      component: _f43d2ee0,
      name: "editor"
    }, {
      path: "/article/:slug?",
      component: _7b2c6a33,
      name: "article"
    }]
  }],

  fallback: false
}

export function createRouter () {
  return new Router(routerOptions)
}
