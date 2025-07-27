<template>
  <div v-if="isVisible" class="profile-popup-overlay" @click="closePopup">
    <div class="profile-popup" @click.stop>
      <div class="popup-header">
        <button @click="closePopup" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading profile...</p>
      </div>

      <div v-else-if="userProfile" class="profile-content">
        <!-- Profile Photo & Basic Info -->
        <div class="profile-header">
          <div class="profile-photo">
            <img 
              v-if="userProfile.avatar"
              :src="userProfile.avatar" 
              :alt="userProfile.name"
              class="avatar"
            >
            <DefaultAvatar 
              v-else
              :size="120" 
              :fontSize="48"
              class="avatar"
            />
          </div>
          <h2>{{ userProfile.name }}</h2>
          <p class="email">{{ userProfile.email }}</p>
          <div class="role-badge" :class="userProfile.role">
            {{ formatRole(userProfile.role) }}
          </div>
        </div>

        <!-- Bio Section -->
        <div v-if="userProfile.bio" class="bio-section">
          <h3>About</h3>
          <p>{{ userProfile.bio }}</p>
        </div>

        <!-- Contact Info -->
        <div v-if="userProfile.phone" class="contact-section">
          <h3>Contact</h3>
          <div class="contact-item">
            <i class="fas fa-phone"></i>
            <span>{{ userProfile.phone }}</span>
          </div>
        </div>

        <!-- Admin Actions -->
        <div class="action-buttons">
          <button @click="viewFullProfile" class="action-btn primary">
            <i class="fas fa-user"></i>
            View Full Profile
          </button>
          <button @click="manageUser" class="action-btn secondary">
            <i class="fas fa-cog"></i>
            Manage User
          </button>
        </div>
      </div>

      <div v-else class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Unable to load profile</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import DefaultAvatar from '@/components/DefaultAvatar.vue'

interface Props {
  userId: string | null
  isVisible: boolean
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  phone?: string
  role: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const router = useRouter()

const loading = ref(false)
const userProfile = ref<UserProfile | null>(null)

// Watch for userId changes
watch(() => props.userId, async (newUserId) => {
  if (newUserId && props.isVisible) {
    await loadUserProfile(newUserId)
  }
}, { immediate: true })

// Watch for visibility changes
watch(() => props.isVisible, async (isVisible) => {
  if (isVisible && props.userId) {
    await loadUserProfile(props.userId)
  }
})

const loadUserProfile = async (userId: string) => {
  if (!userId) return
  
  loading.value = true
  
  try {
    // Load user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (userError) throw userError
    
    userProfile.value = userData
    
  } catch (error) {
    console.error('Error loading user profile:', error)
    userProfile.value = null
  } finally {
    loading.value = false
  }
}

const formatRole = (role: string) => {
  const roleMap: Record<string, string> = {
    'client': 'Client',
    'counselor': 'Counselor',
    'admin': 'Administrator',
    'super_admin': 'Super Administrator'
  }
  return roleMap[role] || role
}

const viewFullProfile = () => {
  if (props.userId) {
    router.push(`/user-management?user=${props.userId}`)
    closePopup()
  }
}

const manageUser = () => {
  if (props.userId) {
    router.push(`/user-management?user=${props.userId}`)
    closePopup()
  }
}

const closePopup = () => {
  emit('close')
}
</script>

<style scoped>
.profile-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.profile-popup {
  background: white;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  position: relative;
}

.popup-header {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1rem 0 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
}

.loading-state i,
.error-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #B91C1C;
}

.error-state i {
  color: #dc3545;
}

.profile-content {
  padding: 0 2rem 2rem 2rem;
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
}

.profile-photo {
  margin-bottom: 1rem;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #B91C1C;
  box-shadow: 0 4px 12px rgba(185, 28, 28, 0.3);
}

.profile-header h2 {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.email {
  color: #666;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 0.5rem;
}

.role-badge.client {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.role-badge.counselor {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.role-badge.admin {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.role-badge.super_admin {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.bio-section,
.contact-section {
  margin-bottom: 1.5rem;
}

.bio-section h3,
.contact-section h3 {
  color: #333;
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.bio-section p {
  color: #666;
  line-height: 1.5;
  margin: 0;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #666;
}

.contact-item i {
  color: #B91C1C;
  width: 16px;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #B91C1C;
  color: white;
}

.action-btn.primary:hover {
  background: #991b1b;
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e0e0e0;
}

.action-btn.secondary:hover {
  background: #e9ecef;
  border-color: #B91C1C;
  color: #B91C1C;
}

@media (max-width: 480px) {
  .profile-popup {
    margin: 0.5rem;
    max-width: none;
    width: calc(100% - 1rem);
  }
  
  .profile-content {
    padding: 0 1rem 1rem 1rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style> 