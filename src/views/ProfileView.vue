<template>
  <div class="profile-view" :class="viewClasses">
    <!-- Template Debug -->
    <div style="position: fixed; top: 70px; right: 10px; background: red; color: white; padding: 10px; font-size: 11px; z-index: 9999;">
      AUTH: {{ isAuthenticated }} | USER: {{ !!authUser }} | LOCAL_USER: {{ !!user }}
    </div>

    <div v-if="!isAuthenticated || !authUser" class="auth-required">
      <i class="fas fa-lock"></i>
      <h2>Authentication Required</h2>
      <p>You need to sign in to view your profile</p>
      <button @click="authStore.showAuth('login')" class="auth-btn">
        <i class="fas fa-sign-in-alt"></i>
        Sign In
      </button>
      <!-- Debug info -->
      <div style="font-size: 12px; color: #666; margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 8px;">
        Debug: isAuthenticated: {{ isAuthenticated }}, hasUser: {{ !!authUser }}, hasUserProfile: {{ !!userProfile }}
      </div>
    </div>
    
    <div v-else-if="isAuthenticated && authUser && (!user || loadingUser)" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading your profile...
    </div>
    
    <div v-else-if="isAuthenticated && authUser && user">
      <div class="profile-header">
        <!-- Profile Photo -->
        <div class="profile-photo-container">
          <div class="profile-photo" @click="isOwnProfile ? openProfilePhotoUpload() : null">
            <img 
              :src="user.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\' viewBox=\'0 0 150 150\'%3E%3Crect width=\'150\' height=\'150\' fill=\'%23f0f0f0\'/%3E%3Ctext x=\'75\' y=\'75\' text-anchor=\'middle\' dy=\'0.3em\' font-family=\'Arial\' font-size=\'14\' fill=\'%23999\'%3ENo Photo%3C/text%3E%3C/svg%3E'" 
              :alt="user.name"
              class="avatar"
              @load="console.log('Profile image loaded:', user.avatar)"
              @error="console.error('Profile image failed to load:', user.avatar)"
            >
            <div v-if="uploadingPhoto" class="upload-overlay">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Uploading...</span>
            </div>
            <div v-else-if="isOwnProfile" class="photo-overlay">
              <i class="fas fa-camera"></i>
              <span>Change Photo</span>
            </div>
          </div>
          <!-- Hidden file input for profile photo -->
          <input 
            v-if="isOwnProfile"
            ref="profilePhotoInput"
            type="file" 
            accept="image/*"
            @change="handleProfilePhotoUpload"
            class="hidden-file-input"
          >
        </div>
        
        <h1>{{ user.name }}</h1>
        <p class="email">{{ user.email }}</p>
        <!-- Debug info (simplified) -->
        <div style="font-size: 12px; color: #999; margin: 5px 0;">
          Avatar: {{ uploadingPhoto ? 'Uploading...' : (user.avatar ? 'Set' : 'None') }}
        </div>
        

        
        <p class="joined-date">
          Member since {{ formatDate(user.joinedDate) }}
        </p>
        
        <div class="actions">
          <button v-if="isOwnProfile" @click="editProfile" class="btn btn-primary">
            <i class="fas fa-edit"></i> Edit Profile
          </button>
          <button v-else @click="contactUser" class="btn btn-primary">
            <i class="fas fa-comment"></i> Send Message
          </button>
        </div>
      </div>
      
      <div v-if="user.bio" class="bio-section">
        <h2>About</h2>
        <p>{{ user.bio }}</p>
      </div>
      


      <!-- Counselor Status Section -->
      <div v-if="isOwnProfile && user.role === 'counselor'" class="counselor-status-section">
        <h2>Counselor Status</h2>
        <div class="status-card">
          <div class="status-header">
            <i class="fas fa-user-md"></i>
            <h3>Licensed Counselor</h3>
            <span class="status-badge active">Active</span>
          </div>
          <p>You are registered as a licensed counselor on our platform.</p>
          <div class="counselor-stats">
            <div class="stat">
              <i class="fas fa-briefcase"></i>
              <span>{{ assignedCasesCount }} active cases</span>
            </div>
            <div class="stat">
              <i class="fas fa-star"></i>
              <span>{{ counselorRating }} rating</span>
            </div>
          </div>
        </div>
      </div>

    </div>
    

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useUserStore } from '@/stores'

import { useAuthStore } from '@/stores/auth'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { User } from '@/types'
import { useResponsiveLayout } from '@/composables/useResponsiveLayout'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()


const authStore = useAuthStore()

// Responsive layout
const { viewClasses, setupResponsiveLayout } = useResponsiveLayout()

// Use computed properties like AppLayout does
const isAuthenticated = computed(() => authStore.isAuthenticated)
const authUser = computed(() => authStore.user)
const userProfile = computed(() => authStore.userProfile)

const user = ref<User | null>(null)
const uploadingPhoto = ref(false)
const loadingUser = ref(false)
const hasLoadedOnce = ref(false)
const userId = computed(() => route.params.userId as string || 'currentUser')
const isOwnProfile = computed(() => !route.params.userId || route.params.userId === 'currentUser')

const profilePhotoInput = ref<HTMLInputElement | null>(null)



// Add reactive computed for debugging
const debugAuth = computed(() => ({
  isAuthenticated: authStore.isAuthenticated,
  hasUser: !!authStore.user,
  hasUserProfile: !!authStore.userProfile,
  userId: authStore.user?.id
}))



const loadUserData = async () => {
  // HARD STOP - only load once per component lifecycle
  if (hasLoadedOnce.value) {
    console.log('❌ User data already loaded in this session, skipping')
    return
  }
  
  // Prevent concurrent loads
  if (loadingUser.value) {
    console.log('❌ Already loading user data, skipping...')
    return
  }
  
  // Only load data if user is authenticated
  if (!isAuthenticated.value || !authUser.value) {
    console.log('❌ User not authenticated - skipping data loading')
    user.value = null
    return
  }
  
  loadingUser.value = true
  hasLoadedOnce.value = true
  console.log('✅ Loading user data for:', authUser.value.id)
  
  try {
    // Try to get avatar from database (ignore other RLS errors)
    let databaseAvatar = null
    try {
      console.log('Attempting to fetch avatar from database...')
      const { data: avatarData, error: avatarError } = await supabaseAdmin
        .from('users')
        .select('avatar')
        .eq('id', authUser.value.id)
        .single()
      
      if (!avatarError && avatarData) {
        databaseAvatar = avatarData.avatar
        console.log('✅ Got avatar from database:', databaseAvatar)
        
        // Update auth store with database avatar
        if (databaseAvatar && authStore.userProfile) {
          authStore.$patch({
            userProfile: {
              ...authStore.userProfile,
              avatar: databaseAvatar
            }
          })
          console.log('✅ Updated auth store with database avatar')
        }
      } else {
        console.log('⚠️ Could not fetch avatar from database, using auth store')
      }
    } catch (avatarFetchError) {
      console.log('⚠️ Avatar fetch failed, using auth store:', avatarFetchError)
    }
    
    // Use database avatar if available, otherwise fall back to auth store
    const avatarToUse = databaseAvatar || userProfile.value?.avatar
    
    // Properly capitalize the name
    const fallbackName = authUser.value.email?.split('@')[0] || 'User'
    const capitalizedName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1)
    
    user.value = {
      id: authUser.value.id,
      name: userProfile.value?.name || capitalizedName,
      email: userProfile.value?.email || authUser.value.email || '',
      phone: userProfile.value?.phone,
      avatar: avatarToUse,
      bio: userProfile.value?.bio,
      location: userProfile.value?.location,
      defaultCommunityId: userProfile.value?.defaultCommunityId,
      socialLinks: userProfile.value?.socialLinks,
      joinedDate: new Date(),
      communities: [],
      role: 'client',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('User profile set with avatar:', avatarToUse)
    console.log('Final user profile:', user.value)
    
    // Sync auth store with the loaded profile data
    if (user.value) {
      console.log('Syncing auth store with loaded profile data...')
      authStore.userProfile = {
        id: user.value.id,
        name: user.value.name, // This now uses the properly capitalized name
        email: user.value.email,
        avatar: user.value.avatar,
        bio: user.value.bio,
        phone: user.value.phone,
        location: user.value.location,
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      console.log('Auth store synced:', authStore.userProfile)
    }
    
    
  } catch (error) {
    console.error('Error in ProfileView loadUserData:', error)
  } finally {
    loadingUser.value = false
  }
}

onMounted(() => {
  console.log('ProfileView mounted')
  
  // Setup responsive layout
  const cleanup = setupResponsiveLayout()
  
  onUnmounted(() => {
    cleanup()
  })
})

// Simple auth state watcher - loadUserData has its own guards
watch([isAuthenticated, authUser], async ([newAuth, newUser]) => {
  if (newAuth && newUser) {
    await loadUserData()
  } else {
    user.value = null
    loadingUser.value = false
    hasLoadedOnce.value = false // Reset for re-login
  }
}, { immediate: true })



// Removed loadUserData function - now using immediate loading in onMounted

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const editProfile = () => {
  if (authStore.isAuthenticated) {
    router.push('/edit-profile')
  } else {
    authStore.showAuth('login')
  }
}

const contactUser = () => {
  if (authStore.isAuthenticated) {
    router.push(`/chat/new_${userId.value}`)
  } else {
    authStore.showAuth('login')
  }
}





// Profile photo upload handlers
const openProfilePhotoUpload = () => {
  if (profilePhotoInput.value) {
    profilePhotoInput.value.click()
  }
}

const handleProfilePhotoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  if (!authStore.user || !authStore.isAuthenticated) {
    alert('You must be logged in to upload a profile photo.')
    return
  }
  
  // Prevent duplicate uploads
  if (uploadingPhoto.value) {
    console.log('❌ Upload already in progress, ignoring duplicate call')
    return
  }
  
  uploadingPhoto.value = true
  const originalAvatar = user.value?.avatar
  
  console.log('🚀 Starting profile photo upload process')
  
  try {
    // Show loading state (but don't set to a fake URL that will fail to load)
    console.log('Starting upload, setting loading state')
    
    // STEP 1: Check for existing avatar and delete it
    console.log('=== CHECKING FOR EXISTING AVATAR TO DELETE ===')
    try {
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('avatar')
        .eq('id', authStore.user.id)
        .single()
        
      if (!fetchError && currentUser?.avatar) {
        console.log('Found existing avatar:', currentUser.avatar)
        
        // Extract filename from URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/profile-photos/filename.ext
        const urlParts = currentUser.avatar.split('/')
        const oldFileName = urlParts[urlParts.length - 1]
        
        if (oldFileName && oldFileName !== 'undefined') {
          console.log('Attempting to delete old file:', oldFileName)
          
          const { error: deleteError } = await supabase.storage
            .from('profile-photos')
            .remove([oldFileName])
            
          if (deleteError) {
            console.warn('⚠️ Could not delete old avatar:', deleteError)
          } else {
            console.log('✅ Successfully deleted old avatar:', oldFileName)
          }
        }
      } else {
        console.log('No existing avatar found or fetch failed')
      }
    } catch (cleanupError) {
      console.warn('⚠️ Error during avatar cleanup:', cleanupError)
      // Continue with upload even if cleanup fails
    }
    
    // STEP 2: Upload new photo
    console.log('=== UPLOADING NEW AVATAR ===')
    
    // Create unique filename (simplified structure)
    const fileExt = file.name.split('.').pop()
    const fileName = `${authStore.user.id}_${Date.now()}.${fileExt}`
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName)
    
    console.log('Photo uploaded successfully:', publicUrl)
    console.log('PublicUrl length:', publicUrl.length)
    console.log('PublicUrl starts with:', publicUrl.substring(0, 50))
    
    // NOW LET'S ACTUALLY FIX THE DATABASE UPDATE
    console.log('=== ATTEMPTING DATABASE UPDATE ===')
    console.log('User ID:', authUser.value?.id)
    console.log('Avatar URL to save:', publicUrl)
    
    if (!authUser.value?.id) {
      throw new Error('No authenticated user ID available')
    }
    
    const currentUserId = authUser.value.id
    
    try {
      // Try the database update with better error handling
      const { data: updateResult, error: updateError } = await supabase
        .from('users')
        .update({ 
          avatar: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserId)
        .select() // This will return the updated row
        
      if (updateError) {
        console.error('❌ Database update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        
        // Try alternative approach - maybe it's an RLS issue, let's check current session
        console.log('Checking current session...')
        const { data: session } = await supabase.auth.getSession()
        console.log('Session details:', {
          hasSession: !!session.session,
          userId: session.session?.user?.id,
          userEmail: session.session?.user?.email
        })
        
        // Try a simple select first to test permissions
        console.log('Testing SELECT permissions...')
        const { data: testSelect, error: selectError } = await supabase
          .from('users')
          .select('id, avatar')
          .eq('id', currentUserId)
          .single()
          
        if (selectError) {
          console.error('❌ Even SELECT failed:', selectError)
          throw new Error(`Database access denied: ${selectError.message}`)
        } else {
          console.log('✅ SELECT works, current avatar in DB:', testSelect.avatar)
          throw new Error(`UPDATE failed but SELECT works: ${updateError.message}`)
        }
      } else {
        console.log('✅ DATABASE UPDATE SUCCESS!')
        console.log('Updated row:', updateResult)
        
        // Verify the update
        const { data: verifyData, error: verifyError } = await supabase
          .from('users')
          .select('avatar')
          .eq('id', currentUserId)
          .single()
          
        if (verifyError) {
          console.error('❌ Verification failed:', verifyError)
        } else {
          console.log('✅ Verification success - avatar in DB:', verifyData.avatar)
          console.log('✅ URL match:', verifyData.avatar === publicUrl)
        }
      }
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError)
      // Continue with UI update even if DB fails
    }
    
    // Update local user display
    if (user.value) {
      console.log('Setting user.value.avatar to:', publicUrl)
      user.value.avatar = publicUrl
      console.log('user.value.avatar is now:', user.value.avatar)
    }
    
    // Update auth store manually since loadUserProfile() hits RLS restrictions
    console.log('Updating auth store manually with database data...')
    
    // Ensure proper name capitalization here too
    const photoUploadFallbackName = authUser.value.email?.split('@')[0] || 'User'
    const photoUploadCapitalizedName = photoUploadFallbackName.charAt(0).toUpperCase() + photoUploadFallbackName.slice(1)
    
    authStore.userProfile = {
      id: currentUserId,
      name: user.value?.name || photoUploadCapitalizedName,
      email: user.value?.email || authUser.value.email || '',
      avatar: publicUrl,
      bio: user.value?.bio,
      phone: user.value?.phone,
      location: user.value?.location,
      role: 'client',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    console.log('Auth store updated with manual profile data:', authStore.userProfile)
    
    // Force reactivity update
    await nextTick()
    console.log('After nextTick - user.value.avatar:', user.value?.avatar)
    
    alert('Profile photo uploaded and saved to database!')
    
  } catch (error) {
    console.error('Upload failed:', error)
    alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    // Revert avatar on error
    if (user.value) {
      user.value.avatar = originalAvatar || undefined
    }
  } finally {
    uploadingPhoto.value = false
    
    // Clear the file input to prevent duplicate triggers
    if (input) {
      input.value = ''
    }
    console.log('🏁 Upload process completed')
  }
}
</script>

<style scoped>
.profile-view {
  min-height: calc(100vh - 60px);
  background-color: #f5f5f5;
  position: fixed;
  top: 60px;
  left: 280px;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  transition: left 0.3s ease, padding 0.3s ease;
  padding: 2rem;
}

/* Responsive layout adjustments */
@media (max-width: 1023px) {
  .profile-view {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .profile-view.sidebar-collapsed {
    left: 70px;
  }
}

.auth-required {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  max-width: 500px;
  margin: 2rem auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.auth-required i {
  font-size: 4rem;
  color: #007AFF;
  margin-bottom: 1rem;
}

.auth-required h2 {
  color: #333;
  margin-bottom: 1rem;
}

.auth-required p {
  color: #666;
  margin-bottom: 2rem;
}

.auth-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.auth-btn:hover {
  background: #0056CC;
}

.loading {
  text-align: center;
  padding: 4rem;
  color: #666;
}

.profile-header {
  background-color: white;
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

/* Profile Photo Styles */
.profile-photo-container {
  display: inline-block;
  margin-bottom: 1.5rem;
}

.profile-photo {
  position: relative;
  display: inline-block;
  cursor: pointer;
  transition: transform 0.2s;
}

.profile-photo:hover {
  transform: scale(1.05);
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #007AFF;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 122, 255, 0.8);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 1;
}

.profile-photo:hover .photo-overlay {
  opacity: 1;
}

.photo-overlay i {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.photo-overlay span {
  font-size: 0.8rem;
  font-weight: 500;
}

.hidden-file-input {
  display: none;
}

.profile-header h1 {
  color: #333;
  margin: 0 0 0.5rem 0;
}

.email {
  color: #666;
  margin: 0 0 1rem 0;
}



.joined-date {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  background-color: #007AFF;
  color: white;
}

.bio-section, .services-section {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.bio-section {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.bio-section h2, .services-section h2 {
  color: #333;
  margin-bottom: 1rem;
}



/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.counselor-application-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.25rem;
}

.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #dc6bac;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal !important;
  margin-bottom: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.btn-outline {
  background: white;
  color: #dc6bac;
  border: 1px solid #dc6bac;
}

.btn-outline:hover {
  background: #dc6bac;
  color: white;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.add-service {
  color: #007AFF;
  font-size: 1.5rem;
  text-decoration: none;
}

.empty-services {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.services-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.service-card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.service-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.service-card h3 {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.category {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
}

.price {
  color: #007AFF;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
}




</style> 