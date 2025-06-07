import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const profile = ref<any>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'super_admin')

  // Initialize authentication
  const initAuth = async () => {
    loading.value = true
    
    try {
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      
      if (initialSession) {
        session.value = initialSession
        user.value = initialSession.user
        await loadProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
        
        if (newSession) {
          await loadProfile()
        } else {
          profile.value = null
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      loading.value = false
    }
  }

  // Load user profile
  const loadProfile = async () => {
    if (!user.value) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        return
      }

      profile.value = data
      
      // Check if user is super admin
      if (data?.role !== 'super_admin') {
        console.warn('User is not a super admin')
        await signOut()
        throw new Error('Access denied: Super Admin privileges required')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      throw error
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    loading.value = true
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      if (data.user) {
        user.value = data.user
        session.value = data.session
        await loadProfile()

        // Verify super admin role
        if (!isAdmin.value) {
          await signOut()
          throw new Error('Access denied: Super Admin privileges required')
        }
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      user.value = null
      session.value = null
      profile.value = null
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  // Create admin user (for development purposes)
  const createAdminUser = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'admin'
          }
        }
      })

      if (error) {
        throw error
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('Create admin user error:', error)
      return { data: null, error }
    }
  }

  return {
    user: computed(() => user.value),
    session: computed(() => session.value),
    profile: computed(() => profile.value),
    loading: computed(() => loading.value),
    isAuthenticated,
    isAdmin,
    initAuth,
    signIn,
    signOut,
    createAdminUser,
    loadProfile
  }
}) 