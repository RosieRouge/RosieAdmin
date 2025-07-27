<template>
  <div class="counselors-view" :class="viewClasses">
    <!-- Compact Header -->
    <div class="header-section">
      <div class="header-top">
        <div class="title-area">
          <h1>Counselor Management</h1>
          <div class="quick-stats">
            <span class="stat-item">
              <i class="fas fa-user-md"></i>
              {{ stats.active }} active
            </span>
            <span class="stat-item">
              <i class="fas fa-calendar-check"></i>
              {{ stats.available }} available
            </span>
            <span class="stat-item">
              <i class="fas fa-tasks"></i>
              {{ stats.avgCases }} avg cases
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn refresh" @click="refreshData" title="Refresh">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          </button>
          <button class="btn btn-secondary" @click="activeTab = 'applications'">
            <i class="fas fa-file-alt"></i>
            Applications
            <span v-if="pendingApplications.length > 0" class="badge">{{ pendingApplications.length }}</span>
          </button>
          <button class="btn btn-primary" @click="showCreateCounselor = true">
            <i class="fas fa-plus"></i>
            <span>Add Counselor</span>
          </button>
        </div>
      </div>
    </div>



    <!-- Tabs -->
    <div class="tabs-section">
      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'counselors' }" 
          @click="activeTab = 'counselors'"
          class="tab-btn"
        >
          <i class="fas fa-users"></i>
          Counselors
          <span v-if="counselors.length > 0" class="count-badge">{{ counselors.length }}</span>
        </button>
        <button 
          :class="{ active: activeTab === 'applications' }" 
          @click="activeTab = 'applications'"
          class="tab-btn"
        >
          <i class="fas fa-file-alt"></i>
          Applications
          <span v-if="pendingApplications.length > 0" class="count-badge urgent">{{ pendingApplications.length }}</span>
        </button>
      </div>
    </div>

    <!-- Counselors Tab -->
    <div v-if="activeTab === 'counselors'">
      <!-- Compact Filters -->
      <div class="filters-row">
        <div class="search-input">
          <i class="fas fa-search"></i>
          <input 
            v-model="filters.search" 
            type="text" 
            placeholder="Search counselors..."
          />
        </div>
        
        <div class="filter-controls">
          <select v-model="filters.status" @change="applyFilters">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select v-model="filters.availability" @change="applyFilters">
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
          
          <select v-model="filters.specialization" @change="applyFilters">
            <option value="">All Specializations</option>
            <option value="abortion_care">Abortion Care</option>
            <option value="contraception">Contraception</option>
            <option value="pregnancy_counseling">Pregnancy Counseling</option>
            <option value="emotional_support">Emotional Support</option>
            <option value="legal_advocacy">Legal Advocacy</option>
            <option value="crisis_intervention">Crisis Intervention</option>
          </select>

          <button @click="clearFilters" class="clear-btn" title="Clear filters">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Counselors Grid -->
      <div class="counselors-grid">
        <div v-for="counselor in filteredCounselors" :key="counselor.id" class="counselor-card">
          <div class="card-header">
            <div class="counselor-avatar">
              <img :src="counselor.avatar || getDefaultAvatar(counselor.name)" :alt="counselor.name" />
              <div class="status-indicator" :class="getAvailabilityStatus(counselor)"></div>
            </div>
            <div class="counselor-info">
              <h3>{{ counselor.name }}</h3>
              <p class="email">{{ counselor.email }}</p>
              <div class="specializations">
                <span v-for="spec in counselor.specializations || []" :key="spec" class="spec-badge">
                  {{ formatSpecialization(spec) }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="card-bottom">
            <div class="card-stats">
              <div class="stat-item">
                <i class="fas fa-briefcase"></i>
                <span>{{ counselor.active_cases || 0 }} active cases</span>
              </div>
            </div>
            
            <div class="card-actions">
              <button class="btn btn-sm btn-outline" @click="viewCounselor(counselor)">
                <i class="fas fa-eye"></i>
                View
              </button>
              <button class="btn btn-sm btn-primary" @click="assignCase(counselor)">
                <i class="fas fa-plus"></i>
                Assign Case
              </button>
              <button 
                class="btn btn-sm" 
                :class="counselor.is_active ? 'btn-warning' : 'btn-success'"
                @click="toggleCounselorStatus(counselor)"
              >
                <i class="fas" :class="counselor.is_active ? 'fa-pause' : 'fa-play'"></i>
                {{ counselor.is_active ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Applications Tab -->
    <div v-if="activeTab === 'applications'">
      <div class="applications-section">
        <div v-if="loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading applications...</p>
        </div>
        
        <div v-else-if="counselorApplications.length === 0" class="empty-state">
          <i class="fas fa-file-alt"></i>
          <p>No counselor applications</p>
          <p class="sub-text">Applications from users will appear here</p>
        </div>

        <div v-else class="applications-grid">
          <div v-for="application in counselorApplications" :key="application.id" class="application-card">
            <div class="application-header">
              <div class="applicant-info">
                <h3>{{ application.user_name || 'Unknown Applicant' }}</h3>
                <p class="email">{{ application.user_email }}</p>
                <span class="status-badge" :class="application.status">
                  {{ application.status.charAt(0).toUpperCase() + application.status.slice(1) }}
                </span>
              </div>
              <div class="application-date">
                <i class="fas fa-calendar"></i>
                <span>{{ formatApplicationDate(application.created_at) }}</span>
              </div>
            </div>
            
            <div class="application-details">
              <div class="detail-row">
                <strong>License:</strong> {{ application.license_type }} #{{ application.license_number }}
              </div>
              <div class="detail-row">
                <strong>State:</strong> {{ application.license_state }}
              </div>
              <div class="detail-row">
                <strong>Experience:</strong> {{ application.years_experience }} years
              </div>
              <div class="detail-row">
                <strong>Specializations:</strong>
                <div class="specializations">
                  <span v-for="spec in application.specializations || []" :key="spec" class="spec-badge">
                    {{ formatSpecialization(spec) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="application-bio">
              <h4>Professional Bio</h4>
              <p>{{ application.bio }}</p>
            </div>
            
            <div class="application-motivation">
              <h4>Motivation</h4>
              <p>{{ application.motivation }}</p>
            </div>
            
            <div v-if="application.status === 'pending'" class="application-actions">
              <button class="btn btn-success" @click="approveApplication(application)">
                <i class="fas fa-check"></i>
                Approve
              </button>
              <button class="btn btn-danger" @click="rejectApplication(application)">
                <i class="fas fa-times"></i>
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom spacer for better scrolling -->
    <div class="bottom-spacer"></div>

    <!-- Add Counselor Modal -->
    <div v-if="showCreateCounselor" class="modal-overlay" @click="closeCreateModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Counselor Role</h3>
          <button class="modal-close" @click="closeCreateModal">×</button>
        </div>
        <div class="modal-body">
          <div class="user-selection-section">
            <div class="form-group">
              <label>Search Users</label>
              <input 
                v-model="userSearch" 
                type="text" 
                placeholder="Search by name or email..."
                @input="searchUsers"
              />
            </div>
            
            <div v-if="searchingUsers" class="loading-state">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Searching users...</p>
            </div>
            
            <div v-else-if="availableUsers.length === 0 && userSearch" class="empty-state">
              <i class="fas fa-search"></i>
              <p>No users found matching your search</p>
            </div>
            
            <div v-else-if="availableUsers.length > 0" class="user-list">
              <div 
                v-for="user in availableUsers" 
                :key="user.id" 
                class="user-option"
                :class="{ selected: selectedUser?.id === user.id }"
                @click="selectUser(user)"
              >
                <div class="user-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <div class="user-info">
                  <div class="user-name">{{ user.name || user.email.split('@')[0] }}</div>
                  <div class="user-email">{{ user.email }}</div>
                   <div class="user-roles">
                     <span class="role-badge" :class="user.role">
                       {{ formatRole(user.role) }}
                     </span>
                   </div>
                </div>
                <div class="selection-indicator">
                  <i class="fas fa-check" v-if="selectedUser?.id === user.id"></i>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="selectedUser" class="selected-user-section">
            <h4>Selected User</h4>
            <div class="selected-user-info">
              <div class="user-avatar">
                <i class="fas fa-user"></i>
              </div>
              <div class="user-details">
                <div class="user-name">{{ selectedUser.name || selectedUser.email.split('@')[0] }}</div>
                <div class="user-email">{{ selectedUser.email }}</div>
                                 <div class="current-roles">
                   Current roles: 
                   <span class="role-badge" :class="selectedUser.role">
                     {{ formatRole(selectedUser.role) }}
                   </span>
                 </div>
              </div>
            </div>
            
            <form @submit.prevent="addCounselorRole">
              <div class="form-group">
                <label>Specializations</label>
                <div class="checkbox-group">
                  <label class="checkbox-label" v-for="spec in specializations" :key="spec.value">
                    <input type="checkbox" v-model="counselorData.specializations" :value="spec.value" />
                    {{ spec.label }}
                  </label>
                </div>
              </div>
              
              <div class="form-group">
                <label>License Number</label>
                <input v-model="counselorData.license_number" type="text" placeholder="Professional license number" />
              </div>
              
              <div class="form-group">
                <label>Bio</label>
                <textarea v-model="counselorData.bio" rows="4" placeholder="Brief professional bio..."></textarea>
              </div>
              
              <div class="modal-actions">
                <button type="button" class="btn btn-outline" @click="closeCreateModal">Cancel</button>
                <button type="submit" class="btn btn-primary" :disabled="loading || !selectedUser">
                  <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                  Add Counselor Role
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      <i class="fas" :class="toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'"></i>
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { User } from '@/types'
import { useResponsiveLayout } from '@/composables/useResponsiveLayout'

// Extended User type for counselors with additional fields
interface CounselorUser extends User {
  avg_response_time?: string
}

const authStore = useAuthStore()

// Responsive layout
const { viewClasses, setupResponsiveLayout } = useResponsiveLayout()

// Component state
const loading = ref(false)
const counselors = ref<CounselorUser[]>([])
const showCreateCounselor = ref(false)
const activeTab = ref<'counselors' | 'applications'>('counselors')
const counselorApplications = ref<any[]>([])

const pendingApplications = computed(() => 
  counselorApplications.value.filter(app => app.status === 'pending')
)

// Filters
const filters = ref({
  status: '',
  availability: '',
  specialization: '',
  search: ''
})

// User search and selection for counselor role assignment
const userSearch = ref('')
const searchingUsers = ref(false)
const availableUsers = ref<User[]>([])
const selectedUser = ref<User | null>(null)

// Counselor data for role assignment
const counselorData = ref({
  specializations: [] as string[],
  license_number: '',
  bio: ''
})

// Toast notifications
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

// Specializations options
const specializations = [
  { value: 'abortion_care', label: 'Abortion Care' },
  { value: 'contraception', label: 'Contraception' },
  { value: 'pregnancy_counseling', label: 'Pregnancy Counseling' },
  { value: 'emotional_support', label: 'Emotional Support' },
  { value: 'legal_advocacy', label: 'Legal Advocacy' },
  { value: 'crisis_intervention', label: 'Crisis Intervention' }
]

// Computed properties
const stats = computed(() => ({
  active: counselors.value.filter(c => c.is_active).length,
  available: counselors.value.filter(c => c.is_active && getAvailabilityStatus(c) === 'available').length,
  avgCases: Math.round(counselors.value.reduce((sum, c) => sum + (c.active_cases || 0), 0) / (counselors.value.length || 1)),
  newThisMonth: counselors.value.filter(c => isThisMonth(c.created_at)).length
}))

const filteredCounselors = computed(() => {
  let filtered = counselors.value

  if (filters.value.status) {
    if (filters.value.status === 'active') {
      filtered = filtered.filter(c => c.is_active)
    } else if (filters.value.status === 'inactive') {
      filtered = filtered.filter(c => !c.is_active)
    }
  }

  if (filters.value.availability) {
    filtered = filtered.filter(c => getAvailabilityStatus(c) === filters.value.availability)
  }

  if (filters.value.specialization) {
    filtered = filtered.filter(c => 
      c.specializations?.includes(filters.value.specialization)
    )
  }

  if (filters.value.search) {
    const query = filters.value.search.toLowerCase()
    filtered = filtered.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    )
  }

  return filtered.sort((a, b) => {
    // Sort by status first (active first), then by name
    if (a.is_active && !b.is_active) return -1
    if (!a.is_active && b.is_active) return 1
    return (a.name || '').localeCompare(b.name || '')
  })
})

// Methods
const loadCounselors = async () => {
  loading.value = true
  try {
    // Load users who have counselor as primary role
    // We'll check for roles array in JavaScript since the column might not exist yet
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading counselors:', error)
      counselors.value = []
      return
    }
    
    // Filter users who have counselor role (primary or additional)
    const counselorUsers = (data || []).filter((user: any) => {
      // Check primary role
      if (user.role === 'counselor') return true
      
      // Check additional roles array (if it exists)
      if (user.roles && Array.isArray(user.roles) && user.roles.includes('counselor')) return true
      
      return false
    })
    
    // Get real active case counts for each counselor
    const counselorsWithCases = await Promise.all(
      counselorUsers.map(async (counselor: any) => {
        let activeCases = 0
        let avgResponseTime = 'N/A'
        
        try {
          const { count } = await supabaseAdmin
            .from('support_cases')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_counselor_id', counselor.id)
            .in('status', ['assigned', 'in_progress'])

          activeCases = count || 0

          // Calculate average response time from real data
          const { data: responseTimes } = await supabaseAdmin
            .from('support_cases')
            .select('created_at, assigned_at')
            .eq('assigned_counselor_id', counselor.id)
            .not('assigned_at', 'is', null)
            .limit(10)

          if (responseTimes && responseTimes.length > 0) {
            const totalMinutes = responseTimes.reduce((sum: number, case_: any) => {
              const created = new Date(case_.created_at).getTime()
              const assigned = new Date(case_.assigned_at).getTime()
              return sum + Math.floor((assigned - created) / (1000 * 60))
            }, 0)
            const avgMinutes = Math.floor(totalMinutes / responseTimes.length)
            avgResponseTime = `${avgMinutes}min`
          }
        } catch (caseError) {
          console.log('Support cases table not available:', caseError)
          activeCases = 0
          avgResponseTime = 'N/A'
        }

        return {
          ...counselor,
          active_cases: activeCases,
          rating: counselor.rating || 0,
          avg_response_time: avgResponseTime,
          specializations: counselor.specializations || []
        }
      })
    )
    
    counselors.value = counselorsWithCases
  } catch (error: any) {
    console.error('Failed to load counselors:', error)
    counselors.value = []
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadCounselors()
  showToast('Counselors refreshed successfully')
}

const applyFilters = () => {
  // Filters are reactive, no action needed
}

const clearFilters = () => {
  filters.value.status = ''
  filters.value.availability = ''
  filters.value.specialization = ''
  filters.value.search = ''
}

const viewCounselor = (counselor: CounselorUser) => {
  // Implement counselor detail view
  console.log('View counselor:', counselor)
}

const assignCase = (counselor: CounselorUser) => {
  // Implement case assignment
  console.log('Assign case to:', counselor)
}

const toggleCounselorStatus = async (counselor: CounselorUser) => {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: !counselor.is_active })
      .eq('id', counselor.id)

    if (error) throw error

    showToast(`Counselor ${counselor.is_active ? 'deactivated' : 'activated'} successfully`)
    await loadCounselors()
  } catch (error: any) {
    showToast('Failed to update counselor status: ' + error.message, 'error')
  }
}

const searchUsers = async () => {
  if (!userSearch.value || userSearch.value.length < 2) {
    availableUsers.value = []
    return
  }

  searchingUsers.value = true
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`name.ilike.%${userSearch.value}%,email.ilike.%${userSearch.value}%`)
      .limit(10)

    if (error) throw error

    // Filter out users who already have counselor role
    availableUsers.value = (data || []).filter(user => {
      return user.role !== 'counselor'
    })
  } catch (error: any) {
    console.error('Failed to search users:', error)
    showToast('Failed to search users: ' + error.message, 'error')
    availableUsers.value = []
  } finally {
    searchingUsers.value = false
  }
}

const selectUser = (user: User) => {
  selectedUser.value = user
}

const addCounselorRole = async () => {
  if (!selectedUser.value) {
    showToast('Please select a user first', 'error')
    return
  }

  loading.value = true
  try {
    // Update user role to counselor
    const { error } = await authStore.updateUserRole(selectedUser.value.id, 'counselor')
    if (error) throw error

    // Update counselor-specific fields
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        bio: counselorData.value.bio || selectedUser.value.bio,
        specializations: counselorData.value.specializations,
        license_number: counselorData.value.license_number,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedUser.value.id)

    if (updateError) {
      console.error('Failed to update counselor profile:', updateError)
    }

    showToast('Counselor role added successfully!')
    closeCreateModal()
    await loadCounselors()
  } catch (error: any) {
    showToast('Failed to add counselor role: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

const closeCreateModal = () => {
  showCreateCounselor.value = false
  userSearch.value = ''
  availableUsers.value = []
  selectedUser.value = null
  counselorData.value = {
    specializations: [],
    license_number: '',
    bio: ''
  }
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

// Utility functions
const getAvailabilityStatus = (counselor: CounselorUser) => {
  if (!counselor.is_active) return 'offline'
  if ((counselor.active_cases || 0) >= 8) return 'busy'
  return 'available'
}

const getDefaultAvatar = (name?: string) => {
  if (!name) return 'https://randomuser.me/api/portraits/men/32.jpg'
  const initials = name.split(' ').map(n => n[0]).join('')
  return `https://ui-avatars.com/api/?name=${initials}&background=B91C1C&color=ffffff&size=128`
}

const formatSpecialization = (spec: string) => {
  return spec.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatRole = (role: string) => {
  return role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const isThisMonth = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

const formatApplicationDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const loadCounselorApplications = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('counselor_applications')
      .select(`
        *,
        users!counselor_applications_user_id_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading counselor applications:', error)
      counselorApplications.value = []
    } else {
      counselorApplications.value = (data || []).map((app: any) => ({
        ...app,
        user_name: app.users?.name,
        user_email: app.users?.email
      }))
    }
  } catch (error) {
    console.error('Error loading counselor applications:', error)
    counselorApplications.value = []
  }
}

const approveApplication = async (application: any) => {
  try {
    // Update application status
    const { error: updateError } = await supabaseAdmin
      .from('counselor_applications')
      .update({ status: 'approved' })
      .eq('id', application.id)

    if (updateError) throw updateError

    // Update user role to counselor
    const { error: roleError } = await supabaseAdmin
      .from('users')
      .update({ 
        role: 'counselor',
        specializations: application.specializations,
        license_number: application.license_number,
        bio: application.bio
      })
      .eq('id', application.user_id)

    if (roleError) throw roleError

    showToast('Application approved! User is now a counselor.', 'success')
    await loadCounselorApplications()
    await loadCounselors()
  } catch (error: any) {
    showToast('Failed to approve application: ' + error.message, 'error')
  }
}

const rejectApplication = async (application: any) => {
  try {
    const { error } = await supabaseAdmin
      .from('counselor_applications')
      .update({ status: 'rejected' })
      .eq('id', application.id)

    if (error) throw error

    showToast('Application rejected.', 'success')
    await loadCounselorApplications()
  } catch (error: any) {
    showToast('Failed to reject application: ' + error.message, 'error')
  }
}

onMounted(() => {
  loadCounselors()
  loadCounselorApplications()
  
  // Setup responsive layout
  const cleanup = setupResponsiveLayout()
  
  onUnmounted(() => {
    cleanup()
  })
})
</script>

<style scoped>
.counselors-view {
  padding: 0.75rem 1rem 2rem 1rem;
  max-width: 100%;
  overflow-x: hidden;
  position: fixed;
  top: 60px;
  left: 280px;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  transition: left 0.3s ease, padding 0.3s ease;
  background: #f8f9fa;
  min-height: 100vh;
}

/* Responsive layout adjustments */
@media (max-width: 1023px) {
  .counselors-view {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .counselors-view.sidebar-collapsed {
    left: 70px;
  }
}

/* New Compact Header Styles */
.header-section {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.title-area h1 {
  color: #B91C1C;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  line-height: 1.2;
}

.quick-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.stat-item i {
  font-size: 0.8rem;
  opacity: 0.8;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.action-btn:hover {
  background: #e9ecef;
  color: #333;
}

.action-btn.refresh:hover {
  color: #3b82f6;
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.search-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  flex: 1;
  min-width: 200px;
}

.search-input i {
  color: #B91C1C;
  font-size: 0.875rem;
}

.search-input input {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 0.875rem;
}

.filter-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.filter-controls select {
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  min-width: 120px;
}

.clear-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.clear-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent-color);
}

.stat-card.active {
  --accent-color: #10b981;
}

.stat-card.available {
  --accent-color: #3b82f6;
}

.stat-card.workload {
  --accent-color: #f59e0b;
}

.stat-card.rating {
  --accent-color: #8b5cf6;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: var(--accent-color);
  flex-shrink: 0;
}

.stat-content h3 {
  margin: 0;
  font-size: 2rem;
  color: #B91C1C;
  font-weight: 700;
}

.stat-content p {
  margin: 0;
  color: #666;
  font-weight: 500;
}

.stat-trend {
  margin-left: auto;
}

.trend-up {
  color: #10b981;
  font-weight: 600;
  font-size: 0.9rem;
}

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #B91C1C;
}

.filter-group input,
.filter-group select {
  padding: 0.75rem;
  border: 2px solid #F8C9C9;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: #B91C1C;
}

.counselors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.counselor-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(185, 28, 28, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  height: 140px;
}

.counselor-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(185, 28, 28, 0.15);
}

.card-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.counselor-avatar {
  position: relative;
  flex-shrink: 0;
}

.counselor-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #F8C9C9;
}

.status-indicator {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.available {
  background: #10b981;
}

.status-indicator.busy {
  background: #f59e0b;
}

.status-indicator.offline {
  background: #6b7280;
}

.counselor-info h3 {
  margin: 0 0 0.125rem 0;
  color: #B91C1C;
  font-size: 1rem;
  line-height: 1.2;
}

.counselor-info .email {
  margin: 0 0 0.375rem 0;
  color: #666;
  font-size: 0.8rem;
  line-height: 1.2;
}

.specializations {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  max-height: 2.4rem;
  overflow: hidden;
}

.spec-badge {
  background: #F8C9C9;
  color: #B91C1C;
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1.2;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  gap: 1rem;
}

.card-stats {
  padding: 0.375rem 0.5rem;
  background: #FDE2E2;
  border-radius: 4px;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  color: #666;
  line-height: 1.2;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-item i {
  color: #B91C1C;
  width: 12px;
  font-size: 0.7rem;
}

.card-actions {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  font-size: 0.9rem;
}

.btn-primary {
  background: #B91C1C;
  color: white;
}

.btn-primary:hover {
  background: #991B1B;
}

.btn-outline {
  background: white;
  color: #B91C1C;
  border: 2px solid #B91C1C;
}

.btn-outline:hover {
  background: #B91C1C;
  color: white;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  line-height: 1.2;
}

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

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 2rem;
  border-bottom: 1px solid #F8C9C9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #B91C1C;
  font-size: 1.5rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0.5rem;
}

.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #B91C1C;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #F8C9C9;
  border-radius: 8px;
  font-size: 0.9rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #B91C1C;
}

.form-group small {
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #666;
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
  border-top: 1px solid #F8C9C9;
}

/* User Selection Styles */
.user-selection-section {
  margin-bottom: 2rem;
}

.user-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #F8C9C9;
  border-radius: 8px;
  margin-top: 1rem;
}

.user-option {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-option:hover {
  background-color: #FDE2E2;
}

.user-option.selected {
  background-color: #F8C9C9;
}

.user-option:last-child {
  border-bottom: none;
}

.user-option .user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #B91C1C;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.user-option .user-info {
  flex: 1;
}

.user-option .user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.user-option .user-email {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.user-option .user-roles {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.user-option .role-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-option .role-badge.user {
  background: #e0e7ff;
  color: #3730a3;
}

.user-option .role-badge.counselor {
  background: #d1fae5;
  color: #047857;
}

.user-option .role-badge.admin {
  background: #F8C9C9;
  color: #B91C1C;
}

.user-option .role-badge.super_admin {
  background: #fef3c7;
  color: #92400e;
}

.selection-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.user-option.selected .selection-indicator {
  opacity: 1;
}

.selected-user-section {
  border-top: 1px solid #F8C9C9;
  padding-top: 2rem;
}

.selected-user-section h4 {
  margin: 0 0 1rem 0;
  color: #B91C1C;
  font-size: 1.2rem;
}

.selected-user-info {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #FDE2E2;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.selected-user-info .user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: #B91C1C;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.selected-user-info .user-details {
  flex: 1;
}

.selected-user-info .user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.selected-user-info .user-email {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.selected-user-info .current-roles {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: #666;
}

.selected-user-info .role-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.toast.success {
  background: #10B981;
}

.toast.error {
  background: #DC2626;
}

/* Mobile Responsive */
@media screen and (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .counselors-grid {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
}

@media screen and (max-width: 768px) {
  .counselors-view {
    padding: 0;
  }
  
  .header {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
    text-align: center;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .header-left h1 {
    font-size: 1.75rem;
  }
  
  .header-left p {
    font-size: 0.9rem;
  }
  
  .header-actions {
    justify-content: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .header-actions .btn {
    flex: 1;
    min-width: 120px;
    max-width: 200px;
  }
  
  .header-actions .btn .badge {
    margin-left: 0.25rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .stat-card {
    padding: 1.5rem;
    gap: 1rem;
  }
  
  .stat-icon {
    width: 45px;
    height: 45px;
  }
  
  .stat-content h3 {
    font-size: 1.75rem;
  }
  
  .tabs-section {
    margin-bottom: 1.5rem;
  }
  
  .tab-btn {
    padding: 1rem;
    font-size: 0.9rem;
  }
  
  .count-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }
  
  .filters-section {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .filters {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .filter-group input,
  .filter-group select {
    padding: 0.75rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .counselors-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .counselor-card {
    padding: 1rem;
    height: 140px;
  }
  
  .counselor-card:hover {
    transform: none;
  }
  
  .card-header {
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .counselor-avatar img {
    width: 40px;
    height: 40px;
  }
  
  .status-indicator {
    width: 12px;
    height: 12px;
    bottom: 1px;
    right: 1px;
  }
  
  .counselor-info h3 {
    font-size: 1rem;
    line-height: 1.2;
    margin: 0 0 0.125rem 0;
  }
  
  .counselor-info .email {
    font-size: 0.8rem;
    line-height: 1.2;
    margin: 0 0 0.375rem 0;
    word-break: break-all;
  }
  
  .spec-badge {
    font-size: 0.65rem;
    padding: 0.125rem 0.375rem;
  }
  
  .card-bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .card-stats {
    padding: 0.375rem 0.5rem;
  }
  
  .stat-item {
    font-size: 0.75rem;
    line-height: 1.2;
  }
  
  .card-actions {
    gap: 0.375rem;
  }
  
  .card-actions .btn {
    flex: 1;
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
    line-height: 1.2;
  }
  
  .applications-section {
    padding: 0;
  }
  
  .applications-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .application-card {
    padding: 1.5rem;
  }
  
  .application-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .application-date {
    justify-content: center;
    font-size: 0.85rem;
  }
  
  .application-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .application-actions .btn {
    width: 100%;
  }
  
  .modal {
    margin: 0.5rem;
    max-height: calc(100vh - 1rem);
    overflow-y: auto;
  }
  
  .modal-header {
    padding: 1.25rem;
  }
  
  .modal-header h3 {
    font-size: 1.25rem;
  }
  
  .modal-body {
    padding: 1.25rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.75rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .checkbox-group {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .modal-actions .btn {
    width: 100%;
    order: 2;
  }
  
  .modal-actions .btn.btn-primary {
    order: 1;
  }
  
  .toast {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    text-align: center;
  }
  
  .loading-state,
  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
  }
  
  .empty-state i {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  
  .empty-state p {
    font-size: 0.9rem;
  }
  
  .empty-state .sub-text {
    font-size: 0.8rem;
  }
}

@media screen and (max-width: 480px) {
  .header {
    padding: 1.25rem;
  }
  
  .header-left h1 {
    font-size: 1.5rem;
  }
  
  .header-left p {
    font-size: 0.85rem;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .header-actions .btn {
    max-width: none;
    padding: 0.75rem;
  }
  
  .stat-card {
    padding: 1.25rem;
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    align-self: center;
  }
  
  .stat-content h3 {
    font-size: 1.5rem;
  }
  
  .stat-content p {
    font-size: 0.85rem;
  }
  
  .trend-up {
    font-size: 0.8rem;
  }
  
  .tab-btn {
    padding: 0.75rem;
    font-size: 0.85rem;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .filters-section {
    padding: 1.25rem;
  }
  
  .filter-group label {
    font-size: 0.9rem;
  }
  
  .counselor-card {
    padding: 1rem;
    height: 140px;
  }
  
  .counselor-avatar img {
    width: 40px;
    height: 40px;
  }
  
  .status-indicator {
    width: 12px;
    height: 12px;
    bottom: 1px;
    right: 1px;
  }
  
  .counselor-info h3 {
    font-size: 1rem;
    line-height: 1.2;
  }
  
  .counselor-info .email {
    font-size: 0.8rem;
    line-height: 1.2;
  }
  
  .spec-badge {
    font-size: 0.65rem;
    padding: 0.125rem 0.375rem;
  }
  
  .card-stats {
    padding: 0.375rem 0.5rem;
  }
  
  .stat-item {
    font-size: 0.75rem;
    line-height: 1.2;
  }
  
  .application-card {
    padding: 1.25rem;
  }
  
  .applicant-info h3 {
    font-size: 1rem;
  }
  
  .applicant-info .email {
    font-size: 0.85rem;
    word-break: break-all;
  }
  
  .status-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  
  .modal {
    margin: 0.25rem;
    max-height: calc(100vh - 0.5rem);
  }
  
  .modal-header,
  .modal-body {
    padding: 1rem;
  }
  
  .modal-header h3 {
    font-size: 1.125rem;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .btn,
  .tab-btn {
    min-height: 44px;
    min-width: 44px;
  }
  
  .counselor-card:hover,
  .application-card:hover,
  .stat-card:hover {
    transform: none;
  }
  
  .counselor-card:active,
  .application-card:active {
    transform: scale(0.98);
  }
  
  .stat-card:active {
    transform: scale(0.98);
  }
  
  .btn:hover,
  .tab-btn:hover {
    background: inherit;
    color: inherit;
  }
  
  .btn:active {
    transform: scale(0.95);
  }
  
  .btn-primary:active {
    background: #991B1B;
  }
  
  .btn-outline:active {
    background: #B91C1C;
    color: white;
  }
  
  .btn-warning:active {
    background: #d97706;
  }
  
  .btn-success:active {
    background: #059669;
  }
  
  .tab-btn:active {
    background: rgba(185, 28, 28, 0.1);
  }
}

/* Landscape orientation on mobile */
@media screen and (max-width: 768px) and (orientation: landscape) {
  .header {
    padding: 1.25rem;
  }
  
  .header-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .counselors-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .applications-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Very small screens */
@media screen and (max-width: 320px) {
  .header-left h1 {
    font-size: 1.25rem;
  }
  
  .header-left p {
    font-size: 0.8rem;
  }
  
  .stat-content h3 {
    font-size: 1.25rem;
  }
  
  .stat-content p {
    font-size: 0.8rem;
  }
  
  .tab-btn {
    padding: 0.6rem;
    font-size: 0.8rem;
  }
  
  .filter-group label {
    font-size: 0.85rem;
  }
  
  .counselor-info h3 {
    font-size: 0.9rem;
  }
  
  .counselor-info .email {
    font-size: 0.8rem;
  }
  
  .stat-item {
    font-size: 0.75rem;
  }
  
  .spec-badge {
    font-size: 0.6rem;
    padding: 0.1rem 0.3rem;
  }
}

/* Tabs Styles */
.tabs-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
  overflow: hidden;
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e9ecef;
}

.tab-btn {
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  position: relative;
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.tab-btn.active {
  color: #B91C1C;
  border-bottom-color: #B91C1C;
  background: rgba(185, 28, 28, 0.05);
}

.count-badge {
  background: #B91C1C;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
}

.count-badge.urgent {
  background: #dc2626;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.badge {
  background: #dc2626;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  font-weight: 600;
  margin-left: 0.5rem;
}

/* Applications Styles */
.applications-section {
  padding: 2rem;
}

.applications-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 2rem;
}

.application-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.application-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(185, 28, 28, 0.15);
}

.application-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.applicant-info h3 {
  margin: 0 0 0.25rem 0;
  color: #B91C1C;
  font-size: 1.2rem;
}

.applicant-info .email {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.pending {
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.status-badge.approved {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.status-badge.rejected {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.application-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.85rem;
}

.application-details {
  margin-bottom: 1.5rem;
}

.detail-row {
  margin-bottom: 0.5rem;
  color: #495057;
  font-size: 0.9rem;
}

.detail-row strong {
  color: #B91C1C;
  margin-right: 0.5rem;
}

.application-bio, .application-motivation {
  margin-bottom: 1.5rem;
}

.application-bio h4, .application-motivation h4 {
  margin: 0 0 0.5rem 0;
  color: #B91C1C;
  font-size: 1rem;
}

.application-bio p, .application-motivation p {
  margin: 0;
  color: #495057;
  line-height: 1.5;
  font-size: 0.9rem;
}

.application-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: #6c757d;
}

.loading-state i {
  font-size: 2rem;
  color: #B91C1C;
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 3rem;
  color: #bdc3c7;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  color: #495057;
}

.sub-text {
  color: #6c757d !important;
  font-size: 0.9rem !important;
}

.bottom-spacer {
  height: 2rem;
  flex-shrink: 0;
}
</style> 