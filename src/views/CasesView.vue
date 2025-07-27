<template>
  <div class="cases-view">
    <!-- Role-based Header -->
    <div class="cases-header">
      <div class="header-content">
        <h1>
          <i class="fas fa-briefcase-medical"></i>
          {{ getHeaderTitle() }}
        </h1>
        <p class="header-subtitle">{{ getHeaderSubtitle() }}</p>
      </div>
      
      <!-- Create Case Button (Clients only) -->
      <button 
        v-if="userRole === 'client'"
        @click="showCreateCaseModal = true"
        class="create-case-btn"
      >
        <i class="fas fa-plus"></i>
        Request Support
      </button>
      
      <!-- Admin Quick Actions -->
      <div v-if="userRole === 'admin'" class="admin-actions">
        <button @click="loadUnassignedCases" class="action-btn urgent">
          <i class="fas fa-exclamation-triangle"></i>
          Unassigned ({{ unassignedCases.length }})
        </button>
        <button @click="loadUrgentCases" class="action-btn critical">
          <i class="fas fa-fire"></i>
          Urgent ({{ urgentCases.length }})
        </button>
      </div>
    </div>

    <!-- Dashboard Stats -->
    <div v-if="dashboardStats" class="dashboard-stats">
      <div class="stat-card">
        <div class="stat-number">{{ dashboardStats.totalCases }}</div>
        <div class="stat-label">Total Cases</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dashboardStats.activeCases }}</div>
        <div class="stat-label">Active Cases</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ dashboardStats.completedCases }}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card urgent">
        <div class="stat-number">{{ dashboardStats.urgentCases }}</div>
        <div class="stat-label">Urgent</div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading cases...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">Try Again</button>
    </div>

    <!-- Cases List -->
    <div v-else class="cases-container">
      <!-- Filters -->
      <div class="cases-filters">
        <div class="filter-tabs">
          <button 
            v-for="status in availableStatuses" 
            :key="status.value"
            @click="selectedStatus = status.value"
            :class="{ active: selectedStatus === status.value }"
            class="filter-tab"
          >
            <i :class="status.icon"></i>
            {{ status.label }}
            <span v-if="getFilterCount(status.value)" class="count">
              {{ getFilterCount(status.value) }}
            </span>
          </button>
        </div>
        
        <div class="filter-controls">
          <select v-model="selectedUrgency" class="urgency-filter">
            <option value="">All Urgency Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select v-if="userRole === 'admin'" v-model="selectedType" class="type-filter">
            <option value="">All Types</option>
            <option value="abortion_support">Abortion Support</option>
            <option value="counseling">Counseling</option>
            <option value="legal_aid">Legal Aid</option>
            <option value="financial_assistance">Financial Assistance</option>
            <option value="transportation">Transportation</option>
            <option value="emotional_support">Emotional Support</option>
            <option value="post_care">Post Care</option>
          </select>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredCases.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>No cases found</h3>
        <p v-if="userRole === 'client'">You haven't submitted any support requests yet.</p>
        <p v-else-if="userRole === 'counselor'">No cases are currently assigned to you.</p>
        <p v-else>No cases match your current filters.</p>
        
        <button 
          v-if="userRole === 'client'"
          @click="showCreateCaseModal = true"
          class="primary-btn"
        >
          <i class="fas fa-plus"></i>
          Request Support
        </button>
      </div>

      <!-- Cases Grid -->
      <div v-else class="cases-grid">
        <div 
          v-for="supportCase in filteredCases" 
          :key="supportCase.id"
          @click="viewCase(supportCase.id)"
          class="case-card"
          :class="[
            `urgency-${supportCase.urgency}`,
            `status-${supportCase.status}`
          ]"
        >
          <div class="case-header">
            <div class="case-title-section">
              <h3 class="case-title">{{ supportCase.title }}</h3>
              <div class="case-meta">
                <span class="case-type">{{ formatCaseType(supportCase.type) }}</span>
                <span class="case-date">{{ formatDate(supportCase.created_at) }}</span>
              </div>
            </div>
            
            <div class="case-badges">
              <span class="urgency-badge" :class="`urgency-${supportCase.urgency}`">
                {{ supportCase.urgency.toUpperCase() }}
              </span>
              <span class="status-badge" :class="`status-${supportCase.status}`">
                {{ formatStatus(supportCase.status) }}
              </span>
            </div>
          </div>

          <div class="case-description">
            {{ supportCase.description.length > 120 
              ? supportCase.description.substring(0, 120) + '...' 
              : supportCase.description 
            }}
          </div>

          <div class="case-footer">
            <div class="case-participants">
              <div v-if="supportCase.client" class="participant">
                <img v-if="supportCase.client.avatar" :src="supportCase.client.avatar" :alt="supportCase.client.name">
                <div v-else class="default-avatar">{{ supportCase.client.name.charAt(0) }}</div>
                <span>{{ supportCase.client.name }}</span>
                <small>(Client)</small>
              </div>
              
              <div v-if="supportCase.assignedDoula" class="participant">
                <img v-if="supportCase.assignedDoula.avatar" :src="supportCase.assignedDoula.avatar" :alt="supportCase.assignedDoula.name">
                <div v-else class="default-avatar">{{ supportCase.assignedDoula.name.charAt(0) }}</div>
                <span>{{ supportCase.assignedDoula.name }}</span>
                <small>({{ supportCase.assignedDoula.role }})</small>
              </div>
              
              <div v-else-if="userRole === 'admin'" class="unassigned-indicator">
                <i class="fas fa-user-plus"></i>
                <span>Unassigned</span>
              </div>
            </div>

            <div class="case-actions">
              <button @click.stop="viewCase(supportCase.id)" class="view-btn">
                <i class="fas fa-eye"></i>
                View
              </button>
              
              <button 
                v-if="userRole === 'admin' && !supportCase.assignedDoulaId"
                @click.stop="showAssignModal(supportCase)"
                class="assign-btn"
              >
                <i class="fas fa-user-plus"></i>
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Case Modal -->
    <CreateCaseModal 
      :show="showCreateCaseModal"
      @close="showCreateCaseModal = false"
      @created="handleCaseCreated"
    />

    <!-- Assign Case Modal -->
    <AssignCaseModal 
      :show="showAssignCaseModal && !!caseToAssign"
      :selectedCase="caseToAssign"
      @close="showAssignCaseModal = false"
      @assigned="handleCaseAssigned"
    />

    <!-- Toast Notifications -->
    <Toast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="closeToast"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCasesStore } from '../stores/cases'
import { storeToRefs } from 'pinia'
import type { SupportCase, CaseStatus, CaseType, UrgencyLevel, UserRole } from '@/types'
import CreateCaseModal from '@/components/CreateCaseModal.vue'
import AssignCaseModal from '@/components/AssignCaseModal.vue'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const authStore = useAuthStore()
const casesStore = useCasesStore()

const { cases, dashboardStats, loading, error } = storeToRefs(casesStore)

// Local state
const showCreateCaseModal = ref(false)
const showAssignCaseModal = ref(false)
const caseToAssign = ref<SupportCase | null>(null)
const selectedStatus = ref<CaseStatus | ''>('')
const selectedUrgency = ref<UrgencyLevel | ''>('')
const selectedType = ref<CaseType | ''>('')
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success')

// Computed properties
const userRole = computed(() => authStore.profile?.role as UserRole || 'client')
const userId = computed(() => authStore.user?.id || '')

const unassignedCases = computed(() => casesStore.getUnassignedCases)
const urgentCases = computed(() => casesStore.getUrgentCases)

const availableStatuses = computed(() => {
  const baseStatuses: Array<{ value: CaseStatus | '', label: string, icon: string }> = [
    { value: '', label: 'All Cases', icon: 'fas fa-list' },
    { value: 'pending', label: 'Pending', icon: 'fas fa-clock' },
    { value: 'assigned', label: 'Assigned', icon: 'fas fa-user-check' },
    { value: 'in_progress', label: 'In Progress', icon: 'fas fa-spinner' },
    { value: 'resolved', label: 'Resolved', icon: 'fas fa-check-circle' },
  ]
  
  if (userRole.value === 'admin') {
    baseStatuses.push({ value: 'closed', label: 'Closed', icon: 'fas fa-archive' })
  }
  
  return baseStatuses
})

const filteredCases = computed(() => {
  let filtered = cases.value

  // Filter by user role
  if (userId.value) {
    filtered = casesStore.getUserCases(userId.value, userRole.value)
  }

  // Filter by status
  if (selectedStatus.value) {
    filtered = filtered.filter((c: any) => c.status === selectedStatus.value)
  }

  // Filter by urgency
  if (selectedUrgency.value) {
    filtered = filtered.filter((c: any) => c.urgency === selectedUrgency.value)
  }

  // Filter by type
  if (selectedType.value) {
    filtered = filtered.filter((c: any) => c.type === selectedType.value)
  }

  // Sort by urgency and date
  return filtered.sort((a: any, b: any) => {
    const urgencyOrder: any = { critical: 4, high: 3, medium: 2, low: 1 }
    const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
    if (urgencyDiff !== 0) return urgencyDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

// Methods
const getHeaderTitle = () => {
  switch (userRole.value) {
    case 'client':
      return 'My Support Cases'
    case 'counselor':
      return 'Assigned Cases'
    case 'admin':
      return 'Case Management'
    default:
      return 'Support Cases'
  }
}

const getHeaderSubtitle = () => {
  switch (userRole.value) {
    case 'client':
      return 'Track your support requests and communicate with your assigned counselor'
    case 'counselor':
      return 'Manage cases assigned to you and provide support to clients'
    case 'admin':
      return 'Oversee all cases, assign doulas, and monitor support activities'
    default:
      return 'Support case management'
  }
}

const getFilterCount = (status: CaseStatus | '') => {
  if (!status) return cases.value.length
  return casesStore.getCasesByStatus(status).length
}

const formatCaseType = (type: CaseType): string => {
  const typeMap: Record<CaseType, string> = {
    abortion_support: 'Abortion Support',
    emotional_support: 'Emotional Support',
    legal_aid: 'Legal Aid',
    financial_assistance: 'Financial Assistance',
    transportation: 'Transportation',
    other: 'Other'
  }
  return typeMap[type] || type
}

const formatStatus = (status: CaseStatus): string => {
  const statusMap: Record<CaseStatus, string> = {
    pending: 'Pending',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
    cancelled: 'Cancelled'
  }
  return statusMap[status] || status
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString()
}

const viewCase = (caseId: string) => {
  router.push(`/cases/${caseId}`)
}

const showAssignModal = (supportCase: SupportCase) => {
  caseToAssign.value = supportCase
  showAssignCaseModal.value = true
}

const loadUnassignedCases = () => {
  selectedStatus.value = 'pending'
}

const loadUrgentCases = () => {
  selectedUrgency.value = 'high'
}

const handleCaseCreated = (newCase: SupportCase) => {
  showCreateCaseModal.value = false
  showToastMessage('Support request created successfully!', 'success')
  // The case should already be added to the store by the modal
}

const handleCaseAssigned = () => {
  showAssignCaseModal.value = false
  caseToAssign.value = null
  showToastMessage('Case assigned successfully!', 'success')
}

const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

const closeToast = () => {
  showToast.value = false
}

const loadData = async () => {
  try {
    if (!userId.value || !userRole.value) {
      console.warn('No user ID or role available')
      return
    }

    await Promise.all([
      casesStore.loadCases(userId.value, userRole.value),
      casesStore.loadDashboardStats(userId.value, userRole.value)
    ])

    // Load doulas for admin users
    if (userRole.value === 'admin') {
      await casesStore.loadAvailableDoulas()
    }

  } catch (error) {
    console.error('Error loading cases data:', error)
    showToastMessage('Failed to load cases. Please try again.', 'error')
  }
}

// Lifecycle
onMounted(() => {
  if (authStore.isAuthenticated) {
    loadData()
  }
})

// Watch for auth changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    loadData()
  }
})
</script>

<style scoped>
.cases-view {
  min-height: 100vh;
  background-color: var(--rosie-pink);
  padding: 1rem;
}

.cases-header {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  color: #333;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-content h1 i {
  color: var(--rosie-primary);
}

.header-subtitle {
  color: #666;
  margin: 0;
  font-size: 1rem;
}

.create-case-btn {
  background: var(--rosie-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: background 0.2s;
}

.create-case-btn:hover {
  background: var(--rosie-primary-dark);
}

.admin-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn.urgent {
  background: #ff9500;
  color: white;
}

.action-btn.critical {
  background: #ff3b30;
  color: white;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card.urgent {
  border-left: 4px solid #ff3b30;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-state i {
  font-size: 2rem;
  color: var(--rosie-primary);
  margin-bottom: 1rem;
}

.error-state i {
  font-size: 2rem;
  color: #ff3b30;
  margin-bottom: 1rem;
}

.retry-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
}

.cases-filters {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-tab {
  background: #f8f9fa;
  border: 2px solid transparent;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.filter-tab:hover {
  background: #e9ecef;
}

.filter-tab.active {
  background: #007AFF;
  color: white;
  border-color: #007AFF;
}

.filter-tab .count {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.filter-tab.active .count {
  background: rgba(255, 255, 255, 0.3);
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.urgency-filter, .type-filter {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
}

.primary-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.case-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
  border-left: 4px solid #e9ecef;
}

.case-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.case-card.urgency-critical {
  border-left-color: #ff3b30;
}

.case-card.urgency-high {
  border-left-color: #ff9500;
}

.case-card.urgency-medium {
  border-left-color: #ffcc00;
}

.case-card.urgency-low {
  border-left-color: #34c759;
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.case-title {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.case-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #666;
}

.case-badges {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.urgency-badge, .status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.urgency-badge.urgency-critical {
  background: #ff3b30;
  color: white;
}

.urgency-badge.urgency-high {
  background: #ff9500;
  color: white;
}

.urgency-badge.urgency-medium {
  background: #ffcc00;
  color: #333;
}

.urgency-badge.urgency-low {
  background: #34c759;
  color: white;
}

.status-badge.status-pending {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #dee2e6;
}

.status-badge.status-assigned {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.status-in_progress {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.status-completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.case-description {
  color: #555;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.case-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.case-participants {
  display: flex;
  gap: 1rem;
}

.participant {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.participant img, .default-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #007AFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
}

.participant small {
  color: #666;
}

.unassigned-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ff9500;
  font-size: 0.85rem;
}

.case-actions {
  display: flex;
  gap: 0.5rem;
}

.view-btn, .assign-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.view-btn {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #dee2e6;
}

.view-btn:hover {
  background: #e9ecef;
}

.assign-btn {
  background: #007AFF;
  color: white;
}

.assign-btn:hover {
  background: #0056CC;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .cases-view {
    padding: 0.5rem;
  }

  .cases-header {
    padding: 1.5rem;
    flex-direction: column;
    align-items: stretch;
  }

  .dashboard-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .cases-grid {
    grid-template-columns: 1fr;
  }

  .filter-tabs {
    justify-content: center;
  }

  .case-header {
    flex-direction: column;
    gap: 1rem;
  }

  .case-badges {
    flex-direction: row;
    align-items: flex-start;
  }

  .case-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .case-actions {
    justify-content: center;
  }
}
</style> 
