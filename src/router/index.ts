import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import UserManagementView from '@/views/UserManagementView.vue'
import CaseManagementView from '@/views/CaseManagementView.vue'
import CounselorsView from '@/views/CounselorsView.vue'
import SupportGroupsView from '@/views/SupportGroupsView.vue'
import ResourcesView from '@/views/ResourcesView.vue'
import CrisisAlertsView from '@/views/CrisisAlertsView.vue'
import MessagesView from '@/views/MessagesView.vue'
import AnalyticsView from '@/views/AnalyticsView.vue'
import SettingsView from '@/views/SettingsView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/case-management',
      name: 'case-management',
      component: CaseManagementView,
      meta: { requiresAuth: true }
    },
    {
      path: '/user-management',
      name: 'user-management',
      component: UserManagementView,
      meta: { requiresAuth: true }
    },
    {
      path: '/counselors',
      name: 'counselors',
      component: CounselorsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/support-groups',
      name: 'support-groups',
      component: SupportGroupsView,
      meta: { requiresAuth: true }
    },

    {
      path: '/resources',
      name: 'resources',
      component: ResourcesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/crisis-alerts',
      name: 'crisis-alerts',
      component: CrisisAlertsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/message-moderation',
      name: 'message-moderation',
      component: MessagesView,
      meta: { requiresAuth: true }
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: AnalyticsView,
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true }
    },

  ]
})

// Authentication guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth if not already done
  if (authStore.loading) {
    await authStore.initAuth()
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if trying to access protected route without authentication
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // Redirect to dashboard if trying to access login while authenticated
    next('/dashboard')
  } else if (authStore.isAuthenticated && to.meta.requiresAuth) {
    // Check if user has admin role
    if (!authStore.isAdmin) {
      // Not an admin, sign out and redirect to login
      await authStore.signOut()
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
