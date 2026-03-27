import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import AuthView from '../views/AuthView.vue'
import { isAuthenticated } from '../services/auth.service'

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

router.beforeEach((to) => {
  const loggedIn = isAuthenticated()
  if (to.path !== '/auth' && !loggedIn) {
    return '/auth'
  }
  if (to.path === '/auth' && loggedIn) {
    return '/'
  }
  return true
})

export default router
