import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useZonesStore } from '@/stores/zones'
import { useDeliveryStore } from '@/stores/delivery'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresGuest: true, title: 'Sign In - Land Scanner', layout: 'auth' }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
      meta: { requiresGuest: true, title: 'Create Account - Land Scanner', layout: 'auth' }
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true, title: 'Dashboard - Land Scanner' }
    },
    {
      path: '/zones',
      name: 'my-zones',
      component: () => import('@/views/MyZones.vue'),
      meta: { requiresAuth: true, title: 'My Zones - Land Scanner' }
    },
    {
      path: '/zones/:id',
      name: 'zone-detail',
      component: () => import('@/views/ZoneDetail.vue'),
      meta: { requiresAuth: true, title: 'Zone Detail - Land Scanner' }
    },
    {
      path: '/requests',
      name: 'my-requests',
      component: () => import('@/views/MyRequests.vue'),
      meta: { requiresAuth: true, title: 'My Requests - Land Scanner' }
    },
    {
      path: '/request',
      redirect: '/request-zone'
    },
    {
      path: '/request-zone',
      name: 'request-zone',
      component: () => import('@/views/RequestZoneV2.vue'),
      meta: { requiresAuth: true, title: 'Request a Zone - Land Scanner' }
    },
    {
      path: '/analyze',
      name: 'analyze',
      component: () => import('@/views/AnalyzeView.vue'),
      meta: { requiresAuth: true, title: 'Analyze - Land Scanner' }
    },
    {
      path: '/analyses',
      name: 'analyses',
      component: () => import('@/views/AnalysesView.vue'),
      meta: { requiresAuth: true, title: 'Results - Land Scanner' }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
      meta: { requiresAuth: true, title: 'Profile - Land Scanner' }
    },
    {
      path: '/404',
      name: 'not-found',
      component: () => import('@/views/errors/NotFound.vue'),
      meta: { title: 'Page Not Found - Land Scanner' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404'
    }
  ],
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 }
})

router.beforeEach(async (to, _from, next) => {
  // Stop any active delivery listener when navigating away from zone detail
  if (_from.name === 'zone-detail' && to.name !== 'zone-detail') {
    useDeliveryStore().stopWatching()
  }

  // Don't carry a previous page's error banner into the next page.
  useZonesStore().clearError()

  const authStore = useAuthStore()

  if (!authStore.isAuthenticated && !authStore.loading) {
    try {
      await authStore.checkAuth()
    } catch (error) {
      console.error('Auth initialization failed:', String(error).replace(/[\r\n]/g, ' '))
    }
  } else if (authStore.loading) {
    // Wait for an in-progress checkAuth to finish before deciding
    await new Promise<void>((resolve) => {
      const stop = setInterval(() => {
        if (!authStore.loading) { clearInterval(stop); resolve() }
      }, 50)
    })
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ path: '/login', query: { redirect: encodeURIComponent(to.fullPath) } })
    return
  }

  if (requiresGuest && authStore.isAuthenticated) {
    next('/')
    return
  }

  next()
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) || 'Land Scanner'
})

export default router
