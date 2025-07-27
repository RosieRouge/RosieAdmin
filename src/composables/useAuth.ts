import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  return {
    // Auth state
    user: computed(() => authStore.user),
    profile: computed(() => authStore.profile),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isAdmin: computed(() => authStore.isAdmin),
    loading: computed(() => authStore.loading),

    // Auth methods
    signOut: authStore.signOut,
    signIn: authStore.signIn,
    forgotPassword: authStore.forgotPassword,
    resetPassword: authStore.resetPassword,
    initAuth: authStore.initAuth,
    loadProfile: authStore.loadProfile
  }
} 