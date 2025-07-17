import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { UserRole } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const profile = ref<any>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => 
    profile.value?.role === 'admin' || profile.value?.role === 'super_admin'
  )
  const isSuperAdmin = computed(() => profile.value?.role === 'super_admin')
  const isCounselor = computed(() => profile.value?.role === 'counselor')

  // Check if user has specific role
  const hasRole = (role: UserRole) => {
    return profile.value?.role === role
  }

  // Get primary role (the user's role)
  const getPrimaryRole = computed(() => {
    return profile.value?.role || 'client'
  })

  // Check if user can assign specific role
  const canAssignRole = (role: UserRole) => {
    if (!profile.value?.role) return false
    
    const userRole = profile.value.role as UserRole
    
    // Only super_admins can assign admin role
    if (role === 'admin') {
      return userRole === 'super_admin'
    }
    
    // Only admins and super_admins can assign counselor role
    if (role === 'counselor') {
      return userRole === 'admin' || userRole === 'super_admin'
    }
    
    // Only admins and super_admins can assign client role
    if (role === 'client') {
      return userRole === 'admin' || userRole === 'super_admin'
    }
    
    // Only super_admins can assign super_admin role
    if (role === 'super_admin') {
      return userRole === 'super_admin'
    }
    
    return false
  }

  // Check if user can remove specific role (change from this role to another)
  const canModifyRole = (currentRole: UserRole, newRole: UserRole) => {
    if (!profile.value?.role) return false
    
    const userRole = profile.value.role as UserRole
    
    // Only super_admins can modify admin roles
    if (currentRole === 'admin' || newRole === 'admin') {
      return userRole === 'super_admin'
    }
    
    // Only admins and super_admins can modify counselor roles
    if (currentRole === 'counselor' || newRole === 'counselor') {
      return userRole === 'admin' || userRole === 'super_admin'
    }
    
    // Only admins and super_admins can modify client roles
    if (currentRole === 'client' || newRole === 'client') {
      return userRole === 'admin' || userRole === 'super_admin'
    }
    
    // Only super_admins can modify super_admin roles
    if (currentRole === 'super_admin' || newRole === 'super_admin') {
      return userRole === 'super_admin'
    }
    
    return false
  }

  // Initialize authentication
  const initAuth = async () => {
    loading.value = true
    
    try {
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
      const { data, error } = await supabaseAdmin
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
      if (!data?.role || (data.role !== 'admin' && data.role !== 'super_admin')) {
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

  // Create user with specified role (admin functionality)
  const createUser = async (
    email: string, 
    password: string, 
    name: string, 
    role: UserRole = 'client',
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
            role: role
          }
        }
      }

      // If skipping email verification, we'll handle this differently
      if (options.skip_email_verification) {
        signUpOptions.options.emailRedirectTo = undefined
      }

      const { data, error } = await supabase.auth.admin.createUser(signUpOptions)

      if (error) {
        throw error
      }

      // Also create the user record in the users table
      if (data.user) {
        const { error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            name: name,
            username: options.username,
            role: role,
            phone: options.phone || null,
            bio: options.bio || null,
            is_active: true,
            is_verified: options.skip_email_verification || false,
            password_reset_required: false
          })

        if (userError) {
          console.error('Error creating user record:', userError)
          throw userError
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
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          password_reset_required: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Use Supabase admin API to update password
      const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
        password: tempPassword
      })

      if (passwordError) {
        throw passwordError
      }
      
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

  // Update user role (admin functionality)
  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw error
      }

      return { data: { success: true }, error: null }
    } catch (error: any) {
      console.error('Update role error:', error)
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
    canModifyRole,
    initAuth,
    signIn,
    signOut,
    createUser,
    resetUserPassword,
    updateUserRole,
    loadProfile
  }
})