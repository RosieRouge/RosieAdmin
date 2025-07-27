<template>
  <div class="case-management" :class="viewClasses">
    <!-- Compact Header with Stats -->
    <div class="header-section">
      <div class="header-top">
        <div class="title-area">
          <h1>Case Management</h1>
          <div class="quick-stats">
            <span class="stat-item crisis">
              <i class="fas fa-exclamation-triangle"></i>
              {{ stats.crisis }} crisis
            </span>
            <span class="stat-item pending">
              <i class="fas fa-clock"></i>
              {{ stats.pending }} pending
            </span>
            <span class="stat-item progress">
              <i class="fas fa-tasks"></i>
              {{ stats.inProgress }} in progress
            </span>
            <span class="stat-item resolved">
              <i class="fas fa-check-circle"></i>
              {{ stats.resolved }} resolved
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button @click="refreshCases" class="action-btn refresh" title="Refresh" :disabled="loading">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          </button>
          <button class="btn btn-primary" @click="showCreateCase = true">
            <i class="fas fa-plus"></i>
            <span>Create Case</span>
          </button>
        </div>
      </div>

      <!-- Compact Filters -->
      <div class="filters-row">
        <div class="search-input">
          <i class="fas fa-search"></i>
          <input 
            v-model="filters.search" 
            type="text" 
            placeholder="Search cases..."
          />
        </div>
        
        <div class="filter-controls">
          <select v-model="filters.status">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <select v-model="filters.type">
            <option value="">All Types</option>
            <option value="abortion_support">Abortion Support</option>
            <option value="contraception_consultation">Contraception</option>
            <option value="pregnancy_options">Pregnancy Options</option>
            <option value="emotional_support">Emotional Support</option>
            <option value="legal_consultation">Legal Support</option>
            <option value="financial_assistance">Financial Aid</option>
            <option value="safety_planning">Safety Planning</option>
            <option value="medical_referral">Medical Referral</option>
          </select>
          
          <select v-model="filters.urgency">
            <option value="">All Urgency</option>
            <option value="crisis">Crisis</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select v-model="filters.counselor">
            <option value="">All Counselors</option>
            <option value="unassigned">Unassigned</option>
            <option v-for="counselor in counselors" :key="counselor.id" :value="counselor.id">
              {{ counselor.name }}
            </option>
          </select>

          <button @click="clearFilters" class="clear-btn" title="Clear filters">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading cases...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCases.length === 0" class="empty-state">
      <i class="fas fa-briefcase-medical"></i>
      <h3>No Cases Found</h3>
      <p>No cases match your current filters or no cases exist yet.</p>
      <button @click="showCreateCase = true" class="btn btn-primary">
        <i class="fas fa-plus"></i>
        Create First Case
      </button>
    </div>

    <!-- Cases Cards -->
    <div v-else class="cases-container">
      <div class="cases-grid">
        <div v-for="case_ in filteredCases" :key="case_.id" class="case-card" :class="{ 'critical-case': case_.urgency === 'critical' }">
          <!-- Card Header -->
          <div class="case-header">
            <div class="case-main-info">
              <div class="case-id-row">
                <span class="case-id-label">Case ID:</span>
                <span class="case-id">{{ case_.id }}</span>
                <span v-if="case_.urgency === 'critical'" class="critical-badge">
                  <i class="fas fa-exclamation-triangle"></i>
                  CRITICAL
                </span>
              </div>
              <h3 class="case-title">{{ case_.title || 'Untitled Case' }}</h3>
              <div class="case-client">
                <i class="fas fa-user"></i>
                {{ getClientName(case_.client_id) }}
              </div>
            </div>
            <div class="case-status-section">
              <span class="status-badge" :class="case_.status">
                {{ formatStatus(case_.status) }}
              </span>
            </div>
          </div>

          <!-- Card Body -->
          <div class="case-body">
            <div class="case-details-grid">
              <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="type-badge" :class="case_.type">
                  {{ formatCaseType(case_.type) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Urgency</span>
                <span class="urgency-badge" :class="case_.urgency">
                  {{ formatUrgency(case_.urgency) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Counselor</span>
                <span class="counselor-name">{{ getCounselorName(case_.assigned_counselor_id) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Created</span>
                <span class="date-text">{{ formatDate(case_.created_at) }}</span>
              </div>
            </div>
            
            <div v-if="case_.description" class="case-description">
              <span class="description-label">Description:</span>
              <p>{{ case_.description.substring(0, 120) }}{{ case_.description.length > 120 ? '...' : '' }}</p>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="case-actions">
            <button @click="viewCase(case_)" class="action-btn view-btn">
              <i class="fas fa-eye"></i>
              View Details
            </button>
            <button 
              v-if="!case_.assigned_counselor_id" 
              @click="openAssignModal(case_)" 
              class="action-btn assign-btn"
            >
              <i class="fas fa-user-plus"></i>
              Assign Counselor
            </button>
            <button 
              v-if="case_.urgency === 'critical'" 
              @click="escalateCase(case_)" 
              class="action-btn escalate-btn"
            >
              <i class="fas fa-bell"></i>
              Escalate
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Counselor Modal -->
    <div v-if="showAssignModal" class="modal-overlay" @click="closeAssignModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Assign Counselor</h3>
          <button class="modal-close" @click="closeAssignModal">×</button>
        </div>
        <div class="modal-body">
          <div class="case-summary">
            <h4>{{ selectedCase?.title }}</h4>
            <p><strong>Type:</strong> {{ formatCaseType(selectedCase?.type) }}</p>
            <p><strong>Urgency:</strong> {{ formatUrgency(selectedCase?.urgency) }}</p>
            <p v-if="selectedCase?.urgency === 'critical'" class="crisis-warning">
              <i class="fas fa-exclamation-triangle"></i>
              This is a crisis case requiring immediate attention
            </p>
          </div>
          
          <div class="form-group">
            <label>Select Counselor:</label>
            <select v-model="selectedCounselorId">
              <option value="">Choose a counselor...</option>
              <option v-for="counselor in availableCounselors" :key="counselor.id" :value="counselor.id">
                {{ counselor.name }} ({{ counselor.active_cases || 0 }} active cases)
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Assignment Notes:</label>
            <textarea v-model="assignmentNotes" placeholder="Optional notes for the counselor..."></textarea>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-outline" @click="closeAssignModal">Cancel</button>
            <button class="btn btn-primary" @click="assignCase" :disabled="!selectedCounselorId">
              Assign Case
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Case Modal -->
    <div v-if="showCreateCase" class="modal-overlay" @click="closeCreateModal">
      <div class="modal large" @click.stop>
        <div class="modal-header">
          <h3>Create New Case</h3>
          <button class="modal-close" @click="closeCreateModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createCase">
            <div class="form-row">
              <div class="form-group">
                <label>Case Title *</label>
                <input v-model="newCase.title" type="text" required />
              </div>
              <div class="form-group">
                <label>Client *</label>
                <select v-model="newCase.client_id" required>
                  <option value="">Select Client</option>
                  <option v-for="client in clients" :key="client.id" :value="client.id">
                    {{ client.name || client.email }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Case Type *</label>
                <select v-model="newCase.type" required>
                  <option value="">Select Type</option>
                  <option value="abortion_support">Abortion Support</option>
                  <option value="contraception_consultation">Contraception Consultation</option>
                  <option value="pregnancy_options">Pregnancy Options</option>
                  <option value="emotional_support">Emotional Support</option>
                  <option value="legal_consultation">Legal Consultation</option>
                  <option value="financial_assistance">Financial Assistance</option>
                  <option value="safety_planning">Safety Planning</option>
                  <option value="medical_referral">Medical Referral</option>
                </select>
              </div>
              <div class="form-group">
                <label>Urgency *</label>
                <select v-model="newCase.urgency" required>
                  <option value="">Select Urgency</option>
                  <option value="crisis">Crisis</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="newCase.description" rows="4" placeholder="Case description..."></textarea>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newCase.is_crisis" />
                This is a crisis case requiring immediate attention
              </label>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" @click="closeCreateModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                Create Case
              </button>
            </div>
          </form>
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
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { SupportCase, User, CaseType, CaseStatus, UrgencyLevel } from '@/types'
import { useResponsiveLayout } from '@/composables/useResponsiveLayout'

// Component state
const loading = ref(false)

// Responsive layout
const { viewClasses, setupResponsiveLayout } = useResponsiveLayout()
const cases = ref<SupportCase[]>([])
const counselors = ref<User[]>([])
const clients = ref<User[]>([])

// Modal states
const showAssignModal = ref(false)
const showCreateCase = ref(false)
const selectedCase = ref<SupportCase | null>(null)
const selectedCounselorId = ref('')
const assignmentNotes = ref('')

// Filters
const filters = ref({
  status: '',
  type: '',
  urgency: '',
  counselor: '',
  search: ''
})

// New case form
const newCase = ref({
  title: '',
  client_id: '',
  type: '' as CaseType,
  urgency: '' as UrgencyLevel,
  description: '',
  is_crisis: false
})

// Toast notifications
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

// Computed properties
const stats = computed(() => ({
  crisis: cases.value.filter(c => c.urgency === 'critical' && ['pending', 'assigned', 'in_progress'].includes(c.status)).length,
  pending: cases.value.filter(c => c.status === 'pending').length,
  inProgress: cases.value.filter(c => c.status === 'in_progress').length,
  resolved: cases.value.filter(c => c.status === 'resolved' && c.completed_at && isThisWeek(c.completed_at)).length
}))

const filteredCases = computed(() => {
  let filtered = cases.value

  if (filters.value.status) {
    filtered = filtered.filter(c => c.status === filters.value.status)
  }
  
  if (filters.value.type) {
    filtered = filtered.filter(c => c.type === filters.value.type)
  }
  
  if (filters.value.urgency) {
    filtered = filtered.filter(c => c.urgency === filters.value.urgency)
  }
  
  if (filters.value.counselor) {
    if (filters.value.counselor === 'unassigned') {
      filtered = filtered.filter(c => !c.assigned_counselor_id)
    } else {
      filtered = filtered.filter(c => c.assigned_counselor_id === filters.value.counselor)
    }
  }
  
  if (filters.value.search) {
    const query = filters.value.search.toLowerCase()
    filtered = filtered.filter(c => 
      c.title?.toLowerCase().includes(query) ||
      getClientName(c.client_id).toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query)
    )
  }

  // Sort by urgency and creation date
  return filtered.sort((a, b) => {
    // Critical urgency comes first
    if (a.urgency === 'critical' && b.urgency !== 'critical') return -1
    if (a.urgency !== 'critical' && b.urgency === 'critical') return 1
    
    const urgencyOrder = ['critical', 'high', 'medium', 'low']
    const aUrgency = urgencyOrder.indexOf(a.urgency)
    const bUrgency = urgencyOrder.indexOf(b.urgency)
    
    if (aUrgency !== bUrgency) return aUrgency - bUrgency
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

const availableCounselors = computed(() => {
  return counselors.value.filter(c => c.is_active)
})

// Methods
const loadCases = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('support_cases')
      .select(`
        *,
        client:users!client_id(*),
        assigned_counselor:users!assigned_counselor_id(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading cases:', error)
      showToast('Failed to load cases', 'error')
      cases.value = []
    } else {
      cases.value = data || []
    }
  } catch (error: any) {
    console.error('Failed to load cases:', error)
    showToast('Failed to load cases', 'error')
    cases.value = []
  } finally {
    loading.value = false
  }
}

const loadCounselors = async () => {
  try {
    // Load users who have counselor as primary role or in roles array
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name')

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

    // Get active case counts for each counselor
    const counselorsWithCases = await Promise.all(
      counselorUsers.map(async (counselor: any) => {
        let activeCases = 0
        
        try {
          const { count } = await supabaseAdmin
            .from('support_cases')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_counselor_id', counselor.id)
            .in('status', ['assigned', 'in_progress'])

          activeCases = count || 0
        } catch (caseError) {
          console.log('Could not get case count for counselor:', counselor.id, caseError)
          activeCases = 0
        }

        return {
          ...counselor,
          active_cases: activeCases
        }
      })
    )

    counselors.value = counselorsWithCases
    console.log('Loaded counselors:', counselorsWithCases.length)
  } catch (error: any) {
    console.error('Failed to load counselors:', error)
    counselors.value = []
  }
}

const loadClients = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'client')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error loading clients:', error)
      clients.value = []
    } else {
      clients.value = data || []
    }
  } catch (error: any) {
    console.error('Failed to load clients:', error)
    clients.value = []
  }
}

const refreshCases = async () => {
  await loadCases()
  showToast('Cases refreshed successfully')
}

const viewCase = (case_: SupportCase) => {
  // Navigate to case detail view or open case detail modal
  // For now, we'll show case information in a simple alert
  const details = `
Case ID: ${case_.id}
Title: ${case_.title}
Client: ${getClientName(case_.client_id)}
Type: ${formatCaseType(case_.type)}
Urgency: ${formatUrgency(case_.urgency)}
Status: ${formatStatus(case_.status)}
Assigned Counselor: ${getCounselorName(case_.assigned_counselor_id)}
Created: ${formatDate(case_.created_at)}
Description: ${case_.description || 'No description'}
  `.trim()
  
  alert(details)
}

const openAssignModal = (case_: SupportCase) => {
  selectedCase.value = case_
  showAssignModal.value = true
  selectedCounselorId.value = ''
  assignmentNotes.value = ''
}

const closeAssignModal = () => {
  showAssignModal.value = false
  selectedCase.value = null
  selectedCounselorId.value = ''
  assignmentNotes.value = ''
}

const assignCase = async () => {
  if (!selectedCase.value || !selectedCounselorId.value) return

  loading.value = true
  
  try {
    const { error } = await supabaseAdmin
      .from('support_cases')
      .update({ assigned_counselor_id: selectedCounselorId.value })
      .eq('id', selectedCase.value!.id)

    if (error) {
      console.error('Error assigning case:', error)
      showToast('Failed to assign case', 'error')
    } else {
      // Update the case in the local array
      const caseIndex = cases.value.findIndex(c => c.id === selectedCase.value!.id)
      if (caseIndex !== -1) {
        const counselor = counselors.value.find(c => c.id === selectedCounselorId.value)
        cases.value[caseIndex] = {
          ...cases.value[caseIndex],
          assigned_counselor_id: selectedCounselorId.value,
          status: 'assigned' as CaseStatus
        }
      }
      showToast('Case assigned successfully')
    }
  } catch (error: any) {
    console.error('Failed to assign case:', error)
    showToast('Failed to assign case', 'error')
  } finally {
    loading.value = false
    closeAssignModal()
  }
}

const escalateCase = async (case_: SupportCase) => {
  try {
    // Update case status to escalated
    const { error } = await supabaseAdmin
      .from('support_cases')
      .update({ 
        status: 'escalated',
        urgency: 'crisis'
      })
      .eq('id', case_.id)

    if (error) {
      console.error('Error escalating case:', error)
      showToast('Failed to escalate case', 'error')
    } else {
      // Update local case
      const caseIndex = cases.value.findIndex(c => c.id === case_.id)
      if (caseIndex !== -1) {
        cases.value[caseIndex].status = 'pending'
        cases.value[caseIndex].urgency = 'critical'
      }
      showToast(`Crisis case ${case_.id.slice(0, 8)} escalated to emergency response team`)
    }
  } catch (error: any) {
    console.error('Failed to escalate case:', error)
    showToast('Failed to escalate case', 'error')
  }
}

const createCase = async () => {
  loading.value = true
  
  try {
    const { error } = await supabaseAdmin
      .from('support_cases')
      .insert({
        id: `case-${Date.now()}`,
        title: newCase.value.title,
        client_id: newCase.value.client_id,
        type: newCase.value.type,
        urgency: newCase.value.urgency,
        status: 'pending' as CaseStatus,
        is_crisis: newCase.value.is_crisis,
        assigned_counselor_id: undefined,
        assigned_counselor: undefined,
        created_at: new Date().toISOString(),
        completed_at: undefined,
        description: newCase.value.description
      })

    if (error) {
      console.error('Error creating case:', error)
      showToast('Failed to create case', 'error')
    } else {
      await loadCases() // Reload cases to include the new one
      showToast('Case created successfully')
    }
  } catch (error: any) {
    console.error('Failed to create case:', error)
    showToast('Failed to create case', 'error')
  } finally {
    loading.value = false
    closeCreateModal()
  }
}

const closeCreateModal = () => {
  showCreateCase.value = false
  newCase.value = {
    title: '',
    client_id: '',
    type: '' as CaseType,
    urgency: '' as UrgencyLevel,
    description: '',
    is_crisis: false
  }
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const clearFilters = () => {
  filters.value = {
    status: '',
    type: '',
    urgency: '',
    counselor: '',
    search: ''
  }
}

// Utility functions
const formatCaseType = (type: CaseType | undefined) => {
  if (!type) return 'Unknown'
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatUrgency = (urgency: UrgencyLevel | undefined) => {
  if (!urgency) return 'Unknown'
  return urgency.charAt(0).toUpperCase() + urgency.slice(1)
}

const formatStatus = (status: CaseStatus) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getClientName = (clientId: string) => {
  const client = clients.value.find(c => c.id === clientId)
  return client?.name || client?.email || 'Anonymous'
}

const getCounselorName = (counselorId?: string) => {
  if (!counselorId) return 'Unassigned'
  const counselor = counselors.value.find(c => c.id === counselorId)
  return counselor?.name || 'Unknown Counselor'
}

const isThisWeek = (dateString: string | null | undefined) => {
  if (!dateString) return false
  const date = new Date(dateString)
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return date >= oneWeekAgo && date <= now
}

onMounted(() => {
  Promise.all([
    loadCases(),
    loadCounselors(),
    loadClients()
  ])
  
  // Setup responsive layout
  const cleanup = setupResponsiveLayout()
  
  onUnmounted(() => {
    cleanup()
  })
})
</script>

<style scoped>
.case-management {
  padding: 2rem;
  background: #FDE2E2;
  min-height: 100vh;
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
  .case-management {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .case-management.sidebar-collapsed {
    left: 70px;
  }
}

.header-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.title-area h1 {
  color: #B91C1C;
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.title-area p {
  color: #666;
  margin: 0;
}

.quick-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}

.stat-item.crisis {
  color: #dc2626;
}

.stat-item.pending {
  color: #f59e0b;
}

.stat-item.progress {
  color: #3b82f6;
}

.stat-item.resolved {
  color: #10b981;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  background: #F8C9C9;
  color: #B91C1C;
  border: 2px solid #B91C1C;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.action-btn:hover {
  background: #B91C1C;
  color: white;
}

.action-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  border-color: #ccc;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  background: #F8C9C9;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  border: 2px solid #F8C9C9;
}

.search-input i {
  color: #B91C1C;
  margin-right: 0.5rem;
}

.search-input input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.9rem;
  color: #B91C1C;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-controls select {
  padding: 0.75rem;
  border: 2px solid #F8C9C9;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #B91C1C;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-controls select:focus {
  outline: none;
  border-color: #B91C1C;
}

.clear-btn {
  background: none;
  border: none;
  color: #B91C1C;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #F8C9C9;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
}

.loading-state i {
  font-size: 3rem;
  color: #B91C1C;
  margin-bottom: 1rem;
}

.loading-state p {
  color: #666;
  font-size: 1.1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
}

.empty-state i {
  font-size: 4rem;
  color: #B91C1C;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #B91C1C;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
}

.cases-container {
  margin-bottom: 2rem;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.case-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  position: relative;
}

.case-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.case-card.critical-case {
  border-left: 6px solid #dc2626;
  background: linear-gradient(135deg, #ffffff 0%, #fef7f7 100%);
}

.case-card.critical-case:hover {
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.2);
}

/* Card Header */
.case-header {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.case-main-info {
  flex: 1;
  min-width: 0;
}

.case-id-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.case-id-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.case-id {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #B91C1C;
  font-weight: 600;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.critical-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #dc2626;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: pulse 2s infinite;
}

.case-title {
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  word-break: break-word;
}

.case-client {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

.case-client i {
  color: #B91C1C;
  font-size: 0.8rem;
}

.case-status-section {
  flex-shrink: 0;
}

/* Card Body */
.case-body {
  padding: 0 1.5rem 1rem 1.5rem;
}

.case-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.counselor-name {
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
}

.date-text {
  color: #6b7280;
  font-size: 0.85rem;
}

.case-description {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.75rem;
}

.description-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 0.5rem;
}

.case-description p {
  margin: 0;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Card Actions */
.case-actions {
  padding: 1rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid #f8f9fa;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  cursor: pointer;
  text-decoration: none;
}

.view-btn {
  background: #f8f9fa;
  color: #6b7280;
  border-color: #e5e7eb;
}

.view-btn:hover {
  background: #e5e7eb;
  color: #374151;
  border-color: #d1d5db;
}

.assign-btn {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #93c5fd;
}

.assign-btn:hover {
  background: #1d4ed8;
  color: white;
  border-color: #1d4ed8;
}

.escalate-btn {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
  animation: pulse 2s infinite;
}

.escalate-btn:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.mobile-case-card.crisis::before,
.desktop-case-card.crisis::before {
  --accent-color: #dc2626;
}

.mobile-case-card.pending::before,
.desktop-case-card.pending::before {
  --accent-color: #f59e0b;
}

.mobile-case-card.progress::before,
.desktop-case-card.progress::before {
  --accent-color: #3b82f6;
}

.mobile-case-card.resolved::before,
.desktop-case-card.resolved::before {
  --accent-color: #10b981;
}

.mobile-case-header,
.desktop-case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.case-id-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: monospace;
  font-size: 0.9rem;
  color: #666;
}

.case-id {
  color: #B91C1C;
  font-weight: 600;
}

.crisis-indicator {
  color: #dc2626;
  margin-left: 0.5rem;
  animation: pulse 2s infinite;
}

.case-title h3 {
  color: #B91C1C;
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
}

.case-client {
  font-size: 0.85rem;
  color: #666;
}

.mobile-case-details,
.desktop-case-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.mobile-detail-item,
.desktop-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-detail-label,
.desktop-detail-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.mobile-detail-value,
.desktop-detail-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #B91C1C;
}

.mobile-case-actions,
.desktop-case-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #F8C9C9;
}

.mobile-action-btn,
.desktop-action-btn {
  background: #F8C9C9;
  color: #B91C1C;
  border: 2px solid #B91C1C;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.mobile-action-btn:hover,
.desktop-action-btn:hover {
  background: #B91C1C;
  color: white;
}

.mobile-action-btn:disabled,
.desktop-action-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
  border-color: #ccc;
}

/* Badge Styles */
.type-badge,
.urgency-badge,
.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.abortion_support { background: #FEE2E2; color: #B91C1C; }
.type-badge.contraception_consultation { background: #DBEAFE; color: #1E40AF; }
.type-badge.pregnancy_options { background: #F3E8FF; color: #7C3AED; }
.type-badge.emotional_support { background: #ECFDF5; color: #047857; }
.type-badge.legal_consultation { background: #FEF3C7; color: #92400E; }
.type-badge.financial_assistance { background: #FECACA; color: #DC2626; }
.type-badge.safety_planning { background: #FED7AA; color: #EA580C; }
.type-badge.medical_referral { background: #E0E7FF; color: #3730A3; }

.urgency-badge.crisis { background: #FEE2E2; color: #DC2626; }
.urgency-badge.urgent { background: #FED7AA; color: #EA580C; }
.urgency-badge.high { background: #FEF3C7; color: #D97706; }
.urgency-badge.medium { background: #DBEAFE; color: #2563EB; }
.urgency-badge.low { background: #F3F4F6; color: #6B7280; }

.status-badge.pending { background: #FEF3C7; color: #D97706; }
.status-badge.assigned { background: #DBEAFE; color: #2563EB; }
.status-badge.in_progress { background: #E0E7FF; color: #3730A3; }
.status-badge.resolved { background: #ECFDF5; color: #047857; }
.status-badge.closed { background: #F3F4F6; color: #6B7280; }

/* Button Styles */
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

/* Responsive Design */
@media screen and (max-width: 768px) {
  .cases-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .case-card {
    border-radius: 12px;
  }
  
  .case-header {
    padding: 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .case-id-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .case-id {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }
  
  .case-title {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .case-body {
    padding: 0 1rem 1rem 1rem;
  }
  
  .case-details-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .case-actions {
    padding: 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .action-btn {
    min-width: auto;
    width: 100%;
    padding: 0.75rem;
  }
}

@media screen and (max-width: 480px) {
  .cases-grid {
    gap: 0.75rem;
  }
  
  .case-header {
    padding: 0.75rem;
  }
  
  .case-title {
    font-size: 0.95rem;
  }
  
  .case-body {
    padding: 0 0.75rem 0.75rem 0.75rem;
  }
  
  .case-actions {
    padding: 0.75rem;
  }
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.modal.large {
  max-width: 800px;
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

.case-summary {
  background: #FDE2E2;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.case-summary h4 {
  margin: 0 0 1rem 0;
  color: #B91C1C;
}

.case-summary p {
  margin: 0.5rem 0;
  color: #666;
}

.crisis-warning {
  background: #FEE2E2;
  color: #DC2626;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #DC2626;
  font-weight: 600;
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

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
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
  .cases-container {
    grid-template-columns: 1fr;
  }
  
  .mobile-case-list,
  .desktop-case-list {
    grid-template-columns: 1fr;
  }
  
  .mobile-case-card,
  .desktop-case-card {
    padding: 1.25rem;
  }
  
  .mobile-case-header,
  .desktop-case-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .case-title h3 {
    font-size: 1.1rem;
  }
  
  .case-client {
    font-size: 0.8rem;
  }
  
  .mobile-case-details,
  .desktop-case-details {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .mobile-detail-item,
  .desktop-detail-item {
    justify-content: space-between;
  }
  
  .mobile-detail-label,
  .desktop-detail-label {
    font-size: 0.75rem;
  }
  
  .mobile-detail-value,
  .desktop-detail-value {
    font-size: 0.85rem;
  }
  
  .mobile-case-actions,
  .desktop-case-actions {
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }
  
  .mobile-action-btn,
  .desktop-action-btn {
    width: 100%;
    justify-content: center;
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
  
  .case-summary {
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }
  
  .case-summary h4 {
    font-size: 1.1rem;
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
}

@media screen and (max-width: 480px) {
  .header-section {
    padding: 1.25rem;
  }
  
  .title-area h1 {
    font-size: 1.75rem;
  }
  
  .title-area p {
    font-size: 0.9rem;
  }
  
  .quick-stats {
    gap: 1rem;
  }
  
  .stat-item {
    font-size: 0.9rem;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .header-actions .btn {
    max-width: none;
    padding: 0.75rem;
  }
  
  .filters-row {
    padding: 1.25rem;
  }
  
  .search-input {
    padding: 0.5rem 0.75rem;
  }
  
  .search-input input {
    font-size: 0.8rem;
  }
  
  .filter-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-controls select {
    padding: 0.75rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .clear-btn {
    padding: 0.5rem;
    font-size: 1.1rem;
  }
  
  .loading-state {
    padding: 3rem 1.5rem;
  }
  
  .loading-state i {
    font-size: 2.5rem;
  }
  
  .loading-state p {
    font-size: 1rem;
  }
  
  .empty-state {
    padding: 3rem 1.5rem;
  }
  
  .empty-state i {
    font-size: 3.5rem;
  }
  
  .empty-state h3 {
    font-size: 1.5rem;
  }
  
  .empty-state p {
    font-size: 0.9rem;
  }
  
  .empty-state .btn {
    padding: 0.75rem;
  }
  
  .cases-container {
    gap: 1rem;
  }
  
  .mobile-case-card,
  .desktop-case-card {
    padding: 1.25rem;
  }
  
  .mobile-case-header,
  .desktop-case-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .case-title h3 {
    font-size: 1.1rem;
  }
  
  .case-client {
    font-size: 0.8rem;
  }
  
  .mobile-case-details,
  .desktop-case-details {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .mobile-detail-item,
  .desktop-detail-item {
    justify-content: space-between;
  }
  
  .mobile-detail-label,
  .desktop-detail-label {
    font-size: 0.75rem;
  }
  
  .mobile-detail-value,
  .desktop-detail-value {
    font-size: 0.85rem;
  }
  
  .mobile-case-actions,
  .desktop-case-actions {
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }
  
  .mobile-action-btn,
  .desktop-action-btn {
    width: 100%;
    justify-content: center;
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
  
  .case-summary {
    padding: 1rem;
  }
  
  .case-summary h4 {
    font-size: 1rem;
  }
  
  .case-summary p {
    font-size: 0.85rem;
  }
  
  .crisis-warning {
    padding: 0.75rem;
    font-size: 0.85rem;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .btn,
  .action-buttons .btn {
    min-height: 44px;
    min-width: 44px;
  }
  
  .cases-table td {
    padding: 1.25rem 1rem;
  }
  
  .stat-card:hover {
    transform: none;
  }
  
  .stat-card:active {
    transform: scale(0.98);
  }
  
  .btn:hover {
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
  
  .btn-danger:active {
    background: #B91C1C;
  }
}

/* Landscape orientation on mobile */
@media screen and (max-width: 768px) and (orientation: landscape) {
  .header-section {
    padding: 1.25rem;
  }
  
  .header-top {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
    text-align: center;
  }
  
  .title-area h1 {
    font-size: 1.75rem;
  }
  
  .title-area p {
    font-size: 0.9rem;
  }
  
  .quick-stats {
    justify-content: center;
  }
  
  .header-actions {
    flex-direction: row;
  }
  
  .header-actions .btn {
    flex: 1;
    max-width: 200px;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.25rem;
  }
  
  .search-input {
    width: 100%;
  }
  
  .filter-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-controls select {
    flex: 1;
    width: calc(50% - 0.5rem); /* Adjust for gap */
  }
  
  .clear-btn {
    width: calc(50% - 0.5rem); /* Adjust for gap */
  }
  
  .cases-container {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .mobile-case-list,
  .desktop-case-list {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .mobile-case-card,
  .desktop-case-card {
    padding: 1.25rem;
  }
  
  .mobile-case-header,
  .desktop-case-header {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
  
  .case-title h3 {
    font-size: 1.1rem;
  }
  
  .case-client {
    font-size: 0.8rem;
  }
  
  .mobile-case-details,
  .desktop-case-details {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .mobile-detail-item,
  .desktop-detail-item {
    justify-content: space-between;
  }
  
  .mobile-detail-label,
  .desktop-detail-label {
    font-size: 0.75rem;
  }
  
  .mobile-detail-value,
  .desktop-detail-value {
    font-size: 0.85rem;
  }
  
  .mobile-case-actions,
  .desktop-case-actions {
    flex-direction: row;
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }
  
  .mobile-action-btn,
  .desktop-action-btn {
    flex: 1;
    max-width: 120px; /* Adjust for gap */
    justify-content: center;
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
  
  .case-summary {
    padding: 1.25rem;
  }
  
  .case-summary h4 {
    font-size: 1.1rem;
  }
  
  .case-summary p {
    font-size: 0.85rem;
  }
  
  .crisis-warning {
    padding: 0.75rem;
    font-size: 0.85rem;
  }
}

/* Very small screens */
@media screen and (max-width: 320px) {
  .header-section {
    padding: 1.25rem;
  }
  
  .title-area h1 {
    font-size: 1.5rem;
  }
  
  .title-area p {
    font-size: 0.85rem;
  }
  
  .quick-stats {
    gap: 0.75rem;
  }
  
  .stat-item {
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
  
  .filters-row {
    padding: 1.25rem;
  }
  
  .search-input {
    padding: 0.5rem 0.75rem;
  }
  
  .search-input input {
    font-size: 0.8rem;
  }
  
  .filter-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filter-controls select {
    padding: 0.75rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .clear-btn {
    padding: 0.5rem;
    font-size: 1.1rem;
  }
  
  .loading-state {
    padding: 3rem 1.5rem;
  }
  
  .loading-state i {
    font-size: 2.5rem;
  }
  
  .loading-state p {
    font-size: 1rem;
  }
  
  .empty-state {
    padding: 3rem 1.5rem;
  }
  
  .empty-state i {
    font-size: 3.5rem;
  }
  
  .empty-state h3 {
    font-size: 1.5rem;
  }
  
  .empty-state p {
    font-size: 0.9rem;
  }
  
  .empty-state .btn {
    padding: 0.75rem;
  }
  
  .cases-container {
    grid-template-columns: 1fr;
  }
  
  .mobile-case-list,
  .desktop-case-list {
    grid-template-columns: 1fr;
  }
  
  .mobile-case-card,
  .desktop-case-card {
    padding: 1.25rem;
  }
  
  .mobile-case-header,
  .desktop-case-header {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
  
  .case-title h3 {
    font-size: 1.1rem;
  }
  
  .case-client {
    font-size: 0.8rem;
  }
  
  .mobile-case-details,
  .desktop-case-details {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .mobile-detail-item,
  .desktop-detail-item {
    justify-content: space-between;
  }
  
  .mobile-detail-label,
  .desktop-detail-label {
    font-size: 0.75rem;
  }
  
  .mobile-detail-value,
  .desktop-detail-value {
    font-size: 0.85rem;
  }
  
  .mobile-case-actions,
  .desktop-case-actions {
    flex-direction: row;
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }
  
  .mobile-action-btn,
  .desktop-action-btn {
    flex: 1;
    max-width: 120px; /* Adjust for gap */
    justify-content: center;
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
  
  .case-summary {
    padding: 1rem;
  }
  
  .case-summary h4 {
    font-size: 1rem;
  }
  
  .case-summary p {
    font-size: 0.85rem;
  }
  
  .crisis-warning {
    padding: 0.75rem;
    font-size: 0.85rem;
  }
}
</style>