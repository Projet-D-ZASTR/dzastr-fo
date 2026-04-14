import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import AuthView from '../views/AuthView.vue'
import InvoicesListView from '../views/InvoicesListView.vue'
import ServicesListView from '../views/ServicesListView.vue'
import InvoiceStatusDashboardView from '../views/InvoiceStatusDashboardView.vue'
import { isAuthenticated } from '../services/auth.service'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: InvoiceStatusDashboardView,
  },
  {
    path: '/clients',
    name: 'clients',
    component: MainView,
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthView,
  },
  {
    path: '/factures',
    name: 'invoices-list',
    component: InvoicesListView,
  },
  {
    path: '/services',
    name: 'services-list',
    component: ServicesListView,
  },
  { path: '/dashboard-etats', redirect: '/dashboard' },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
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
    return '/dashboard'
  }
  return true
})

export default router
