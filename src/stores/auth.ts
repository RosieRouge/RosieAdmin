import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const profile = ref<any>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => 
    profile.value?.roles?.includes('admin') || profile.value?.roles?.includes('super_admin')
  )
  const isSuperAdmin = computed(() => profile.value?.roles?.includes('super_admin'))
  const isCounselor = computed(() => profile.value?.roles?.includes('counselor'))

  // Check if user has specific role
  const hasRole = (role: UserRole) => {
    return profile.value?.roles?.includes(role) || false
  }

  // Get primary role (highest level role)
  const getPrimaryRole = computed(() => {
    if (!profile.value?.roles) return 'user'
    const roles = profile.value.roles as UserRole[]
    
    if (roles.includes('super_admin')) return 'super_admin'
    if (roles.includes('admin')) return 'admin'
    if (roles.includes('counselor')) return 'counselor'
    return 'user'
  })

  // Check if user can assign specific role
  const canAssignRole = (role: UserRole) => {
    if (!profile.value?.roles) return false
    
    const userRoles = profile.value.roles as UserRole[]
    
    // Only super_admins can assign admin role
    if (role === 'admin') {
      return userRoles.includes('super_admin')
    }
    
    // Only admins and super_admins can assign counselor role
    if (role === 'counselor') {
      return userRoles.includes('admin') || userRoles.includes('super_admin')
    }
    
    // Only admins and super_admins can assign user role
    if (role === 'user') {
      return userRoles.includes('admin') || userRoles.includes('super_admin')
    }
    
    // Only super_admins can assign super_admin role
    if (role === 'super_admin') {
      return userRoles.includes('super_admin')
    }
    
    return false
  }

  // Check if user can remove specific role
  const canRemoveRole = (role: UserRole) => {
    if (!profile.value?.roles) return false
    
    const userRoles = profile.value.roles as UserRole[]
    
    // Only super_admins can remove admin role
    if (role === 'admin') {
      return userRoles.includes('super_admin')
    }
    
    // Only admins and super_admins can remove counselor role
    if (role === 'counselor') {
      return userRoles.includes('admin') || userRoles.includes('super_admin')
    }
    
    // Only admins and super_admins can remove user role
    if (role === 'user') {
      return userRoles.includes('admin') || userRoles.includes('super_admin')
    }
    
    // Only super_admins can remove super_admin role
    if (role === 'super_admin') {
      return userRoles.includes('super_admin')
    }
    
    return false
  }

  // Initialize authentication
  const initAuth = async () => {
    loading.value = true
    
    try {
      // Check for development session first
      const devSession = localStorage.getItem('rosie-admin-dev-session')
      if (devSession) {
        const sessionData = JSON.parse(devSession)
        if (sessionData.email === 'admin@rosie.com') {
          // Restore development session
          user.value = sessionData.user
          session.value = sessionData.session
          profile.value = sessionData.profile
          loading.value = false
          return
        }
      }

      // Get initial session from Supabase
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
          // Clear development session if logging out
          localStorage.removeItem('rosie-admin-dev-session')
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
      // For development, skip database query and use mock profile
      if (user.value.email === 'admin@rosie.com') {
        profile.value = {
          id: user.value.id,
          email: user.value.email,
          name: 'Super Admin',
          roles: ['super_admin', 'admin', 'counselor', 'user'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone: null,
          bio: null,
          avatar: null,
          last_login: null
        }
        return
      }

      // For other users, attempt to load from database
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
      
      // Check if user has admin privileges (admin or super_admin)
      if (!data?.roles?.includes('admin') && !data?.roles?.includes('super_admin')) {
        console.warn('User does not have admin privileges')
        await signOut()
        throw new Error('Access denied: Only administrators and super administrators can access this panel')
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
      // Development bypass for admin@rosie.com
      if (email === 'admin@rosie.com' && password === 'admin123') {
        console.log('Using development bypass for admin login')
        
        // Create mock user and session
        const mockUser = {
          id: 'da73083e-c247-41c4-8056-c2f63c53dd8f',
          email: 'admin@rosie.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: { name: 'Super Admin' },
          aud: 'authenticated',
          confirmation_sent_at: null,
          confirmed_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          identities: [],
          last_sign_in_at: new Date().toISOString(),
          phone: null,
          recovery_sent_at: null,
          role: 'authenticated'
        }
        
        const mockSession = {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: 'bearer',
          user: mockUser
        }
        
        // Set mock profile
        const mockProfile = {
          id: 'da73083e-c247-41c4-8056-c2f63c53dd8f',
          email: 'admin@rosie.com',
          name: 'Super Admin',
          roles: ['super_admin', 'admin', 'counselor', 'user'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone: null,
          bio: null,
          avatar: null,
          last_login: null
        }
        
        user.value = mockUser as any
        session.value = mockSession as any
        profile.value = mockProfile
        
        // Persist development session in localStorage
        localStorage.setItem('rosie-admin-dev-session', JSON.stringify({
          email: 'admin@rosie.com',
          user: mockUser,
          session: mockSession,
          profile: mockProfile
        }))
        
        return { data: { user: mockUser, session: mockSession }, error: null }
      }

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

        // Verify admin role (admin or super_admin only)
        if (!isAdmin.value) {
          await signOut()
          throw new Error('Access denied: Only administrators and super administrators can access this panel')
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
      // Clear development session first
      localStorage.removeItem('rosie-admin-dev-session')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      user.value = null
      session.value = null
      profile.value = null
    } catch (error) {
      console.error('Sign out error:', error)
      // Still clear the state even if Supabase signOut fails
      user.value = null
      session.value = null
      profile.value = null
      throw error
    }
  }

  // Create user with specified roles (admin functionality)
  const createUser = async (
    email: string, 
    password: string, 
    name: string, 
    roles: UserRole[] = ['user'],
    options: {
      username?: string
      phone?: string
      bio?: string
      specializations?: string[]
      license_number?: string
      skip_email_verification?: boolean
    } = {}
  ) => {
    try {
      const signUpOptions: any = {
        email,
        password,
        options: {
          data: {
            name: name,
            username: options.username,
            roles: roles
          }
        }
      }

      // If skipping email verification, we'll handle this differently
      if (options.skip_email_verification) {
        signUpOptions.options.emailRedirectTo = undefined
      }

      const { data, error } = await supabase.auth.signUp(signUpOptions)

      if (error) {
        throw error
      }

      // Also create the user record in the users table
      if (data.user) {
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            name: name,
            username: options.username,
            roles: roles,
            phone: options.phone || null,
            bio: options.bio || null,
            specializations: options.specializations || [],
            license_number: options.license_number || null,
            is_active: true,
            skip_email_verification: options.skip_email_verification || false,
            password_reset_required: false
          })

        if (userError) {
          console.error('Error creating user record:', userError)
        }
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('Create user error:', error)
      return { data: null, error }
    }
  }

  // Reset user password (admin functionality)
  const resetUserPassword = async (userId: string, newPassword?: string) => {
    try {
      // If no password provided, generate a temporary one
      const tempPassword = newPassword || `temp_${Math.random().toString(36).slice(2, 10)}`
      
      // Update user to require password reset
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_reset_required: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Note: In a real implementation, you'd use Supabase admin API to reset password
      // For now, we'll just mark the user as requiring a password reset
      
      return { 
        data: { 
          temporary_password: tempPassword,
          reset_required: true 
        }, 
        error: null 
      }
    } catch (error: any) {
      console.error('Password reset error:', error)
      return { data: null, error }
    }
  }

  // Update user roles (admin functionality)
  const updateUserRoles = async (userId: string, roles: UserRole[]) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          roles: roles,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw error
      }

      return { data: { success: true }, error: null }
    } catch (error: any) {
      console.error('Update roles error:', error)
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
    isSuperAdmin,
    isCounselor,
    getPrimaryRole,
    hasRole,
    canAssignRole,
    canRemoveRole,
    initAuth,
    signIn,
    signOut,
    createUser,
    resetUserPassword,
    updateUserRoles,
    loadProfile
  }
})