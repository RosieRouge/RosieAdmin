<template>
  <div class="edit-profile-view" :class="viewClasses">
    <div v-if="!authStore.isAuthenticated" class="auth-required">
      <i class="fas fa-lock"></i>
      <h2>Authentication Required</h2>
      <p>You need to sign in to edit your profile</p>
      <button @click="$router.push('/login')" class="auth-btn">
        <i class="fas fa-right-to-bracket"></i>
        Sign In
      </button>
    </div>
    
    <div v-else class="profile-container">
      <div class="profile-header">
        <div class="header-top">
          <button @click="$router.go(-1)" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            Back
          </button>
          
          <!-- Help Button -->
          <button @click="showHelp" class="help-btn">
            <i class="fas fa-question-circle"></i>
            Help
          </button>
        </div>
        
        <h1>Edit Profile</h1>
        <p>Welcome, {{ profileData.name || authStore.user?.email?.split('@')[0] || 'User' }}! Edit your profile and services below:</p>
      </div>





      <!-- Profile Form -->
      <div class="tab-content">
        <form @submit.prevent="saveProfile" class="form">
          <div class="form-group">
            <label for="name">Username *</label>
            <input 
              id="name"
              v-model="profileData.name" 
              type="text" 
              required 
              placeholder="Enter your display name/username"
              :title="'Current username: ' + (profileData.name || 'Not set')"
            >
            <small>This is how your name will appear to other users</small>
          </div>

          <div class="form-group">
            <label for="email">Email *</label>
            <input 
              id="email"
              v-model="profileData.email" 
              type="email" 
              required 
              placeholder="Enter your email address"
            >
          </div>


          
          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea 
              id="bio"
              v-model="profileData.bio" 
              placeholder="Tell us about yourself..."
              rows="4"
            ></textarea>
          </div>
          



          
          <div class="form-actions">
            <button type="button" @click="$router.go(-1)" class="btn secondary">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="btn primary">
              <i v-if="saving" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              {{ saving ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>
        </form>
      </div>





      <!-- Logout Section -->
      <div class="logout-section">
        <button @click="logout" class="logout-btn">
          <i class="fas fa-right-from-bracket"></i>
          Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { useResponsiveLayout } from '@/composables/useResponsiveLayout'

const authStore = useAuthStore()

// Responsive layout
const { viewClasses, setupResponsiveLayout } = useResponsiveLayout()

// Reactive data
const saving = ref(false)

// Profile data
const profileData = ref({
  name: '',
  email: '',
  bio: '',
  avatar: ''
})



// Initialize data
onMounted(async () => {
  await loadProfileData()
  
  // Setup responsive layout
  const cleanup = setupResponsiveLayout()
  
  onUnmounted(() => {
    cleanup()
  })
})

// Load profile data from database (same approach as ProfileView)
const loadProfileData = async () => {
  if (!authStore.isAuthenticated || !authStore.user) {
    console.log('User not authenticated')
    return
  }
  
  try {
    console.log('Loading profile data for EditProfileView...')
    
    // Try to get data from database first
    let databaseData = null
    try {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authStore.user?.id)
        .single()
      
      if (!userError && userData) {
        databaseData = userData
        console.log('Got profile data from database:', databaseData)
      } else {
        console.log('Could not fetch from database, using auth store')
      }
    } catch (dbError) {
      console.log('Database fetch failed, using auth store:', dbError)
    }
    
    // Populate form with database data or fallback to auth store profile
    const sourceData = databaseData || authStore.profile || {}
    
    profileData.value = {
      name: sourceData.name || authStore.user?.email?.split('@')[0] || '',
      email: sourceData.email || authStore.user?.email || '',
      bio: sourceData.bio || '',
      avatar: sourceData.avatar || ''
    }
    

    
    console.log('Profile form populated:', profileData.value)
    
  } catch (error) {
    console.error('Error loading profile data:', error)
  }
}

// Profile functions  
const saveProfile = async () => {
  saving.value = true
  
  try {
    // Simple profile update to database
    if (!authStore.user?.id) {
      throw new Error('No authenticated user')
    }
    
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        name: profileData.value.name,
        email: profileData.value.email,
        bio: profileData.value.bio,
        avatar: profileData.value.avatar,
        updated_at: new Date().toISOString()
      })
      .eq('id', authStore.user?.id)
    
    if (error) {
      console.error('Profile update error:', error)
      alert('Failed to update profile. Please try again.')
    } else {
      alert('Profile updated successfully! Your username and other details have been saved.')
      // Optionally reload the profile data to show the updated information
      await loadProfileData()
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    alert('Failed to update profile. Please try again.')
  } finally {
    saving.value = false
  }
}





// Other functions
const showHelp = () => {
  alert('Help functionality will be implemented in the next update!')
}

const logout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    await authStore.signOut()
    alert('You have been logged out successfully!')
  }
}
</script>

<style scoped>
.edit-profile-view {
  min-height: calc(100vh - 60px);
  background-color: #f5f5f5;
  padding: 2rem;
  position: fixed;
  top: 60px;
  left: 280px;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  transition: left 0.3s ease, padding 0.3s ease;
}

/* Responsive layout adjustments */
@media (max-width: 1023px) {
  .edit-profile-view {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .edit-profile-view.sidebar-collapsed {
    left: 70px;
  }
}

.auth-required {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  max-width: 500px;
  margin: 0 auto;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  transition: background 0.2s;
}

.auth-btn:hover {
  background: #0056CC;
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-header {
  margin-bottom: 2rem;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.back-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e0e0e0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e9ecef;
  border-color: #007AFF;
  color: #007AFF;
}

.profile-header h1 {
  color: #333;
  margin-bottom: 0.5rem;
}

.profile-header p {
  color: #666;
  margin-bottom: 2rem;
}



.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #007AFF;
  color: white;
}

.tab-content {
  margin-bottom: 2rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.form-group small {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn.secondary {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e0e0e0;
}

.btn.secondary:hover {
  background: #e9ecef;
}

.btn.primary {
  background: #007AFF;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #0056CC;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.services-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.services-header h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 4rem;
  color: #007AFF;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
}

.service-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.service-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 1rem;
}

.service-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-content {
  flex: 1;
}

.service-content h4 {
  color: #333;
  margin-bottom: 0.5rem;
}

.service-content p {
  color: #666;
  margin-bottom: 0.5rem;
}

.service-pricing {
  margin-bottom: 0.5rem;
}

.price {
  font-weight: 500;
}

.price-options {
  display: flex;
  gap: 0.5rem;
}

.price-option {
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.service-location {
  margin-bottom: 0.5rem;
}

.service-availability {
  margin-bottom: 0.5rem;
}

.service-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.modal-header h3 {
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.service-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pricing-options {
  display: flex;
  gap: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-input {
  margin-bottom: 1rem;
}

.price-tiers {
  margin-bottom: 1rem;
}

.price-tier {
  display: flex;
  gap: 0.5rem;
}

.checkbox-group {
  display: flex;
  gap: 0.5rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.image-inputs {
  display: flex;
  gap: 0.5rem;
}

.image-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.images-preview {
  display: flex;
  gap: 0.5rem;
}

.image-preview-item {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logout-section {
  text-align: center;
  margin-top: 2rem;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.help-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e0e0e0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.help-btn:hover {
  background: #e9ecef;
}



.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.tab-btn {
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
}

.tab-btn.active {
  color: #007AFF;
  border-bottom-color: #007AFF;
  background: rgba(0, 122, 255, 0.1);
}

.tab-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-preview {
  margin-top: 0.5rem;
}

.image-preview img {
  max-width: 150px;
  max-height: 150px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.image-preview.banner img {
  max-width: 300px;
  max-height: 150px;
}

.services-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.services-header h3 {
  color: #333;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-state i {
  font-size: 4rem;
  color: #007AFF;
  margin-bottom: 1rem;
}

.empty-state p {
  margin-bottom: 2rem;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.service-card {
  display: flex;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  transition: all 0.2s;
}

.service-card:hover {
  border-color: #007AFF;
  box-shadow: 0 4px 8px rgba(0, 122, 255, 0.1);
}

.service-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 1.5rem;
  flex-shrink: 0;
}

.service-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.service-content {
  flex: 1;
}

.service-content h4 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.service-category {
  background: #007AFF;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.service-description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.service-pricing {
  margin-bottom: 0.5rem;
}

.price {
  font-weight: 600;
  color: #28a745;
  font-size: 1.1rem;
}

.price-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.price-option {
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #495057;
}

.service-location {
  color: #666;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.service-availability {
  color: #28a745;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.service-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;
}

.btn-icon {
  background: none;
  border: 2px solid #e0e0e0;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.btn-icon:hover {
  background: #f8f9fa;
  border-color: #007AFF;
  color: #007AFF;
}

.btn-icon.delete {
  color: #dc3545;
}

.btn-icon.delete:hover {
  border-color: #dc3545;
  background: #fff5f5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.modal-header h3 {
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #dc3545;
}

.service-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pricing-options {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  margin: 0;
}

.price-input input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.price-tiers {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.price-tier {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.price-tier input {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-option input[type="checkbox"] {
  margin: 0;
}

.btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.image-inputs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.image-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.image-input input {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.images-preview {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.image-preview-item {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logout-section {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #e0e0e0;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

@media (max-width: 768px) {
  .edit-profile-view {
    padding: 1rem;
  }
  
  .profile-container {
    max-width: none;
  }
  
  .profile-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .tabs {
    flex-direction: column;
  }
  
  .tab-content {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .services-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .service-card {
    flex-direction: column;
  }
  
  .service-image {
    width: 100%;
    height: 200px;
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .service-actions {
    flex-direction: row;
    justify-content: center;
    margin-left: 0;
    margin-top: 1rem;
  }
  
  .modal {
    width: 95%;
    padding: 1rem;
  }
  
  .price-tier {
    flex-direction: column;
  }
  
  .image-input {
    flex-direction: column;
  }
}
</style> 