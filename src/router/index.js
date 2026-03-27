import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import AuthView from '../views/AuthView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: MainView,
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthView,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/auth',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
