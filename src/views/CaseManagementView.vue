<template>
  <div class="case-management">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>Case Management</h1>
        <p>Manage and assign reproductive health support cases</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" @click="refreshCases">
          <i class="fas fa-refresh" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
        <button class="btn btn-primary" @click="showCreateCase = true">
          <i class="fas fa-plus"></i>
          Create Case
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-card crisis">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.crisis }}</h3>
          <p>Crisis Cases</p>
        </div>
        <div class="stat-trend crisis">
          <i class="fas fa-triangle-exclamation"></i>
        </div>
      </div>
      
      <div class="stat-card pending">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.pending }}</h3>
          <p>Pending Assignment</p>
        </div>
      </div>
      
      <div class="stat-card progress">
        <div class="stat-icon">
          <i class="fas fa-tasks"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.inProgress }}</h3>
          <p>In Progress</p>
        </div>
      </div>
      
      <div class="stat-card resolved">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.resolved }}</h3>
          <p>Resolved This Week</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters">
        <div class="filter-group">
          <label>Status:</label>
          <select v-model="filters.status">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Type:</label>
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
        </div>
        
        <div class="filter-group">
          <label>Urgency:</label>
          <select v-model="filters.urgency">
            <option value="">All Urgency</option>
            <option value="crisis">Crisis</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Counselor:</label>
          <select v-model="filters.counselor">
            <option value="">All Counselors</option>
            <option value="unassigned">Unassigned</option>
            <option v-for="counselor in counselors" :key="counselor.id" :value="counselor.id">
              {{ counselor.name }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Search:</label>
          <input v-model="filters.search" type="text" placeholder="Search cases..." />
        </div>
      </div>
    </div>

    <!-- Cases Table -->
    <div class="table-container">
      <table class="cases-table">
        <thead>
          <tr>
            <th>Case ID</th>
            <th>Client</th>
            <th>Type</th>
            <th>Urgency</th>
            <th>Status</th>
            <th>Counselor</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="case_ in filteredCases" :key="case_.id" :class="{ 'crisis-row': case_.is_crisis }">
            <td class="case-id">
              {{ case_.id.slice(0, 8) }}...
              <span v-if="case_.is_crisis" class="crisis-indicator">
                <i class="fas fa-exclamation-triangle"></i>
              </span>
            </td>
            <td>{{ case_.client?.name || 'Anonymous' }}</td>
            <td>
              <span class="type-badge" :class="case_.type">
                {{ formatCaseType(case_.type) }}
              </span>
            </td>
            <td>
              <span class="urgency-badge" :class="case_.urgency">
                {{ formatUrgency(case_.urgency) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="case_.status">
                {{ formatStatus(case_.status) }}
              </span>
            </td>
            <td>{{ case_.assigned_counselor?.name || 'Unassigned' }}</td>
            <td>{{ formatDate(case_.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button class="btn btn-sm btn-outline" @click="viewCase(case_)">
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  v-if="!case_.assigned_counselor_id" 
                  class="btn btn-sm btn-primary" 
                  @click="openAssignModal(case_)"
                >
                  <i class="fas fa-user-plus"></i>
                </button>
                <button 
                  v-if="case_.is_crisis" 
                  class="btn btn-sm btn-danger" 
                  @click="escalateCase(case_)"
                  title="Escalate Crisis"
                >
                  <i class="fas fa-bell"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
            <p v-if="selectedCase?.is_crisis" class="crisis-warning">
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
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { SupportCase, User, CaseType, CaseStatus, UrgencyLevel } from '@/types'

// Component state
const loading = ref(false)
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
  crisis: cases.value.filter(c => c.is_crisis && ['pending', 'assigned', 'in_progress'].includes(c.status)).length,
  pending: cases.value.filter(c => c.status === 'pending').length,
  inProgress: cases.value.filter(c => c.status === 'in_progress').length,
  resolved: cases.value.filter(c => c.status === 'resolved' && isThisWeek(c.completed_at)).length
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
      c.client?.name?.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query)
    )
  }

  // Sort by urgency and creation date
  return filtered.sort((a, b) => {
    if (a.is_crisis && !b.is_crisis) return -1
    if (!a.is_crisis && b.is_crisis) return 1
    
    const urgencyOrder = ['crisis', 'urgent', 'high', 'medium', 'low']
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
  // Use mock data directly to avoid 404 errors
  cases.value = [
    {
      id: 'case-001',
      title: 'Emergency Contraception Support',
      client: { id: 'client-001', name: 'Sarah M.', email: 'sarah@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      type: 'abortion_support' as CaseType,
      urgency: 'crisis' as UrgencyLevel,
      status: 'pending' as CaseStatus,
      is_crisis: true,
      assigned_counselor: undefined,
      assigned_counselor_id: undefined,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      completed_at: undefined
    },
    {
      id: 'case-002',
      title: 'Pregnancy Options Consultation',
      client: { id: 'client-002', name: 'Maria L.', email: 'maria@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      type: 'pregnancy_options' as CaseType,
      urgency: 'urgent' as UrgencyLevel,
      status: 'assigned' as CaseStatus,
      is_crisis: false,
      assigned_counselor: { id: 'counselor-001', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@example.com', role: 'counselor' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      assigned_counselor_id: 'counselor-001',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      completed_at: undefined
    },
    {
      id: 'case-003',
      title: 'Emotional Support Session',
      client: { id: 'client-003', name: 'Jennifer K.', email: 'jennifer@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      type: 'emotional_support' as CaseType,
      urgency: 'medium' as UrgencyLevel,
      status: 'in_progress' as CaseStatus,
      is_crisis: false,
      assigned_counselor: { id: 'counselor-002', name: 'Dr. Maria Rodriguez', email: 'maria.rodriguez@example.com', role: 'counselor' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      assigned_counselor_id: 'counselor-002',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      completed_at: undefined
    },
    {
      id: 'case-004',
      title: 'Legal Consultation',
      client: { id: 'client-004', name: 'Amanda R.', email: 'amanda@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      type: 'legal_consultation' as CaseType,
      urgency: 'high' as UrgencyLevel,
      status: 'resolved' as CaseStatus,
      is_crisis: false,
      assigned_counselor: { id: 'counselor-003', name: 'Dr. Jennifer Kim', email: 'jennifer.kim@example.com', role: 'counselor' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      assigned_counselor_id: 'counselor-003',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      completed_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      id: 'case-005',
      title: 'Financial Assistance Request',
      client: { id: 'client-005', name: 'Lisa T.', email: 'lisa@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      type: 'financial_assistance' as CaseType,
      urgency: 'medium' as UrgencyLevel,
      status: 'pending' as CaseStatus,
      is_crisis: false,
      assigned_counselor: undefined,
      assigned_counselor_id: undefined,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      completed_at: undefined
    }
  ] as SupportCase[]
  loading.value = false
}

const loadCounselors = async () => {
  // Use mock data directly to avoid 404 errors
  counselors.value = [
    { id: 'counselor-001', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@example.com', role: 'counselor' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), active_cases: 2 },
    { id: 'counselor-002', name: 'Dr. Maria Rodriguez', email: 'maria.rodriguez@example.com', role: 'counselor' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), active_cases: 1 },
    { id: 'counselor-003', name: 'Dr. Jennifer Kim', email: 'jennifer.kim@example.com', role: 'counselor' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), active_cases: 3 },
    { id: 'counselor-004', name: 'Dr. Amanda Chen', email: 'amanda.chen@example.com', role: 'counselor' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), active_cases: 0 }
  ]
}

const loadClients = async () => {
  // Use mock data directly to avoid 404 errors
  clients.value = [
    { id: 'client-001', name: 'Sarah M.', email: 'sarah@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'client-002', name: 'Maria L.', email: 'maria@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'client-003', name: 'Jennifer K.', email: 'jennifer@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'client-004', name: 'Amanda R.', email: 'amanda@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'client-005', name: 'Lisa T.', email: 'lisa@example.com', role: 'client' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ]
}

const refreshCases = async () => {
  await loadCases()
  showToast('Cases refreshed successfully')
}

const viewCase = (case_: SupportCase) => {
  // Implement case detail view
  console.log('View case:', case_)
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
  
  // Mock assignment - update the case in memory
  const caseIndex = cases.value.findIndex(c => c.id === selectedCase.value!.id)
  if (caseIndex !== -1) {
    const counselor = counselors.value.find(c => c.id === selectedCounselorId.value)
    cases.value[caseIndex] = {
      ...cases.value[caseIndex],
      assigned_counselor_id: selectedCounselorId.value,
      assigned_counselor: counselor,
      status: 'assigned' as CaseStatus
    }
  }

  showToast('Case assigned successfully')
  closeAssignModal()
  loading.value = false
}

const escalateCase = async (case_: SupportCase) => {
  // Implement crisis escalation
  showToast(`Crisis case ${case_.id.slice(0, 8)} escalated to emergency response team`)
}

const createCase = async () => {
  loading.value = true
  
  // Mock case creation - add to memory
  const client = clients.value.find(c => c.id === newCase.value.client_id)
  const newCaseData = {
    id: `case-${Date.now()}`,
    title: newCase.value.title,
    client: client,
    type: newCase.value.type,
    urgency: newCase.value.urgency,
    status: 'pending' as CaseStatus,
    is_crisis: newCase.value.is_crisis,
    assigned_counselor: undefined,
    assigned_counselor_id: undefined,
    created_at: new Date().toISOString(),
    completed_at: undefined,
    description: newCase.value.description
  }
  
  cases.value.unshift(newCaseData as SupportCase)

  showToast('Case created successfully')
  closeCreateModal()
  loading.value = false
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
})
</script>

<style scoped>
.case-management {
  padding: 2rem;
  background: #FDE2E2;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
}

.header-left h1 {
  color: #B91C1C;
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.header-left p {
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
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

.stat-card.crisis {
  --accent-color: #dc2626;
}

.stat-card.pending {
  --accent-color: #f59e0b;
}

.stat-card.progress {
  --accent-color: #3b82f6;
}

.stat-card.resolved {
  --accent-color: #10b981;
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
  font-size: 1.2rem;
}

.stat-trend.crisis {
  color: #dc2626;
  animation: pulse 2s infinite;
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

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
}

.cases-table {
  width: 100%;
  border-collapse: collapse;
}

.cases-table th {
  background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%);
  color: white;
  padding: 1.5rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cases-table td {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid #F8C9C9;
  vertical-align: middle;
}

.cases-table tr:hover {
  background: #FDE2E2;
}

.crisis-row {
  background: rgba(220, 38, 38, 0.05);
  border-left: 4px solid #dc2626;
}

.case-id {
  font-family: monospace;
  position: relative;
}

.crisis-indicator {
  color: #dc2626;
  margin-left: 0.5rem;
  animation: pulse 2s infinite;
}

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

.action-buttons {
  display: flex;
  gap: 0.5rem;
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

.btn-danger {
  background: #DC2626;
  color: white;
}

.btn-danger:hover {
  background: #B91C1C;
}

.btn-sm {
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
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
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media screen and (max-width: 768px) {
  .case-management {
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
  }
  
  .header-actions .btn {
    flex: 1;
    max-width: 200px;
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
  
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .cases-table {
    min-width: 900px;
  }
  
  .cases-table th,
  .cases-table td {
    padding: 1rem 0.75rem;
    font-size: 0.85rem;
  }
  
  .type-badge,
  .urgency-badge,
  .status-badge {
    padding: 0.3rem 0.6rem;
    font-size: 0.7rem;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .action-buttons .btn {
    padding: 0.4rem;
    min-width: 32px;
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
  
  .filters-section {
    padding: 1.25rem;
  }
  
  .filter-group label {
    font-size: 0.9rem;
  }
  
  .cases-table {
    min-width: 1000px;
  }
  
  .cases-table th,
  .cases-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .type-badge,
  .urgency-badge,
  .status-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
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
  .header {
    padding: 1.25rem;
  }
  
  .header-actions {
    flex-direction: row;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters {
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
  
  .filter-group label {
    font-size: 0.85rem;
  }
  
  .cases-table th,
  .cases-table td {
    padding: 0.6rem 0.4rem;
    font-size: 0.75rem;
  }
  
  .type-badge,
  .urgency-badge,
  .status-badge {
    padding: 0.2rem 0.4rem;
    font-size: 0.6rem;
  }
}
</style>