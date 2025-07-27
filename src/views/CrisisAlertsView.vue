<template>
  <div class="crisis-alerts admin-view" :class="viewClasses">
    <div class="header">
      <div class="header-left">
        <h1>Crisis Alerts</h1>
        <p>Manage crisis situations and emergency support requests</p>
      </div>
      <div class="header-actions">
        <button @click="refreshAlerts" class="btn btn-secondary" :disabled="loading">
          <i class="fas fa-arrows-rotate" :class="{ 'fa-spin': loading }"></i>
          <span>Refresh</span>
        </button>
        <button @click="exportAlerts" class="btn btn-outline">
          <i class="fas fa-download"></i>
          <span>Export</span>
        </button>
      </div>
    </div>

    <!-- Crisis Stats -->
    <div class="stats-grid">
      <div class="stat-card urgent">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.active }}</h3>
          <p>Active Alerts</p>
          <small>Requiring immediate attention</small>
        </div>
      </div>
      <div class="stat-card high">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.pending }}</h3>
          <p>Pending Response</p>
          <small>Awaiting counselor assignment</small>
        </div>
      </div>
      <div class="stat-card resolved">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.resolved }}</h3>
          <p>Resolved Today</p>
          <small>Successfully handled</small>
        </div>
      </div>
      <div class="stat-card response-time">
        <div class="stat-icon">
          <i class="fas fa-stopwatch"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.avgResponseTime }}</h3>
          <p>Avg Response Time</p>
          <small>Time to first response</small>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search by client name, phone, or description..."
        />
      </div>
      
      <div class="filters">
        <select v-model="priorityFilter" @change="applyFilters">
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
        </select>
        
        <select v-model="statusFilter" @change="applyFilters">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        
        <select v-model="sortBy" @change="applyFilters">
          <option value="created_at">Newest First</option>
          <option value="priority">Priority</option>
          <option value="response_time">Response Time</option>
        </select>

        <button @click="clearFilters" class="clear-filters-btn">
          <i class="fas fa-times"></i>
          <span>Clear</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading crisis alerts...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAlerts.length === 0" class="empty-state">
      <i class="fas fa-shield-alt"></i>
      <h3>No Crisis Alerts</h3>
      <p>{{ searchQuery || priorityFilter || statusFilter ? 'No alerts match your current filters.' : 'No crisis alerts at this time.' }}</p>
    </div>

    <!-- Crisis Alerts List -->
    <div v-else class="alerts-container">
      <div 
        v-for="alert in filteredAlerts" 
        :key="alert.id" 
        class="alert-card"
        :class="[`priority-${alert.priority}`, `status-${alert.status}`]"
      >
        <div class="alert-header">
          <div class="alert-priority">
            <span class="priority-badge" :class="alert.priority">
              <i class="fas fa-exclamation-triangle" v-if="alert.priority === 'critical'"></i>
              <i class="fas fa-exclamation" v-else-if="alert.priority === 'high'"></i>
              <i class="fas fa-info-circle" v-else></i>
              {{ alert.priority.toUpperCase() }}
            </span>
          </div>
          <div class="alert-time">
            <i class="fas fa-clock"></i>
            {{ formatTimeAgo(alert.created_at) }}
          </div>
        </div>

        <div class="alert-content">
          <div class="alert-details">
            <h3>{{ alert.title || 'Crisis Alert' }}</h3>
            <p class="alert-description">{{ alert.description }}</p>
            
            <div class="alert-meta">
              <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>{{ alert.client_name || 'Anonymous' }}</span>
              </div>
              <div class="meta-item" v-if="alert.client_phone">
                <i class="fas fa-phone"></i>
                <span>{{ alert.client_phone }}</span>
              </div>
              <div class="meta-item" v-if="alert.location">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ alert.location }}</span>
              </div>
            </div>
            
            <!-- Support Types from metadata -->
            <div v-if="getSupportTypesFromMetadata(alert).length > 0" class="support-types">
              <div class="support-types-label">
                <i class="fas fa-hands-helping"></i>
                Support Needed:
              </div>
              <div class="support-tags">
                <span 
                  v-for="type in getSupportTypesFromMetadata(alert)" 
                  :key="type"
                  class="support-tag"
                  :class="getSupportTypeClass(type)"
                >
                  {{ formatSupportType(type) }}
                </span>
              </div>
            </div>
          </div>

          <div class="alert-status">
            <div class="status-badge" :class="alert.status">
              {{ formatStatus(alert.status) }}
            </div>
            <div v-if="alert.assigned_counselor" class="assigned-to">
              <i class="fas fa-user-md"></i>
              <span>{{ alert.assigned_counselor.name }}</span>
            </div>
          </div>
        </div>

        <div class="alert-actions">
          <button 
            v-if="alert.status === 'pending'"
            @click="assignCounselor(alert)" 
            class="btn btn-primary btn-sm"
          >
            <i class="fas fa-user-plus"></i>
            Assign Counselor
          </button>
          
          <button 
            v-if="alert.status === 'assigned' || alert.status === 'in_progress'"
            @click="updateStatus(alert, 'resolved')" 
            class="btn btn-success btn-sm"
          >
            <i class="fas fa-check"></i>
            Mark Resolved
          </button>
          
          <button @click="viewDetails(alert)" class="btn btn-outline btn-sm">
            <i class="fas fa-eye"></i>
            View Details
          </button>
          
          <button 
            v-if="alert.client_phone"
            @click="callClient(alert.client_phone)" 
            class="btn btn-warning btn-sm"
          >
            <i class="fas fa-phone"></i>
            Call
          </button>
        </div>

        <!-- Response Timeline -->
        <div v-if="alert.responses && alert.responses.length > 0" class="response-timeline">
          <h4>Response Timeline</h4>
          <div 
            v-for="response in alert.responses" 
            :key="response.id"
            class="response-item"
          >
            <div class="response-time">{{ formatDateTime(response.created_at) }}</div>
            <div class="response-content">
              <strong>{{ response.counselor_name }}:</strong> {{ response.notes }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Crisis Alert Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal large" @click.stop>
        <div class="modal-header">
          <h3>Crisis Alert Details</h3>
          <button class="modal-close" @click="closeDetailsModal">×</button>
        </div>
        <div class="modal-body" v-if="selectedAlert">
          <div class="detail-section">
            <h4>Alert Information</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Priority:</label>
                <span class="priority-badge" :class="selectedAlert.priority">
                  {{ selectedAlert.priority.toUpperCase() }}
                </span>
              </div>
              <div class="detail-item">
                <label>Status:</label>
                <span class="status-badge" :class="selectedAlert.status">
                  {{ formatStatus(selectedAlert.status) }}
                </span>
              </div>
              <div class="detail-item">
                <label>Created:</label>
                <span>{{ formatDateTime(selectedAlert.created_at) }}</span>
              </div>
              <div class="detail-item" v-if="selectedAlert.assigned_counselor">
                <label>Assigned to:</label>
                <span>{{ selectedAlert.assigned_counselor.name }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>Client Information</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Name:</label>
                <span>{{ selectedAlert.client_name || 'Anonymous' }}</span>
              </div>
              <div class="detail-item" v-if="selectedAlert.client_phone">
                <label>Phone:</label>
                <span>{{ selectedAlert.client_phone }}</span>
              </div>
              <div class="detail-item" v-if="selectedAlert.location">
                <label>Location:</label>
                <span>{{ selectedAlert.location }}</span>
              </div>
              <div class="detail-item" v-if="getPreferredContactTime(selectedAlert)">
                <label>Preferred Contact Time:</label>
                <span>{{ formatContactTime(getPreferredContactTime(selectedAlert)) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" v-if="getSupportTypesFromMetadata(selectedAlert).length > 0">
            <h4>Support Types Requested</h4>
            <div class="support-types-detail">
              <span 
                v-for="type in getSupportTypesFromMetadata(selectedAlert)" 
                :key="type"
                class="support-tag large"
                :class="getSupportTypeClass(type)"
              >
                {{ formatSupportType(type) }}
              </span>
            </div>
          </div>

          <div class="detail-section">
            <h4>Description</h4>
            <p>{{ selectedAlert.description }}</p>
          </div>

          <div class="detail-section" v-if="selectedAlert.responses && selectedAlert.responses.length > 0">
            <h4>Response History</h4>
            <div class="response-history">
              <div 
                v-for="response in selectedAlert.responses" 
                :key="response.id"
                class="response-item"
              >
                <div class="response-header">
                  <strong>{{ response.counselor_name }}</strong>
                  <span class="response-time">{{ formatDateTime(response.created_at) }}</span>
                </div>
                <div class="response-content">{{ response.notes }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDetailsModal" class="btn btn-outline">Close</button>
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
          <div class="form-group">
            <label>Select Counselor *</label>
            <select v-model="selectedCounselorId" required>
              <option value="">Choose a counselor...</option>
              <option 
                v-for="counselor in availableCounselors" 
                :key="counselor.id"
                :value="counselor.id"
              >
                {{ counselor.name }} ({{ counselor.active_cases || 0 }} active cases)
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Assignment Notes</label>
            <textarea 
              v-model="assignmentNotes" 
              placeholder="Add any relevant notes for the counselor..."
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeAssignModal" class="btn btn-outline">Cancel</button>
          <button @click="confirmAssignment" class="btn btn-primary" :disabled="!selectedCounselorId || loading">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-user-plus"></i>
            {{ loading ? 'Assigning...' : 'Assign Counselor' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useResponsiveLayout } from '@/composables/useResponsiveLayout'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

// Crisis alert structure matching Supabase schema
interface CrisisAlert {
  id: string
  title?: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated'
  client_id?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  location?: string
  crisis_type?: string
  is_immediate_danger?: boolean
  needs_medical_attention?: boolean
  needs_legal_help?: boolean
  needs_financial_assistance?: boolean
  needs_travel_help?: boolean
  assigned_counselor_id?: string
  assigned_at?: string
  assigned_by?: string
  resolved_at?: string
  resolved_by?: string
  resolution_notes?: string
  metadata?: any
  created_at: string
  updated_at?: string
  assigned_counselor?: User
  responses?: Array<{
    id: string
    counselor_name: string
    notes: string
    created_at: string
  }>
}

// Responsive layout
const { viewClasses, setupResponsiveLayout } = useResponsiveLayout()

// Data
const alerts = ref<CrisisAlert[]>([])
const loading = ref(false)
const searchQuery = ref('')
const priorityFilter = ref('')
const statusFilter = ref('')
const sortBy = ref('created_at')

// Modals
const showDetailsModal = ref(false)
const showAssignModal = ref(false)
const selectedAlert = ref<CrisisAlert | null>(null)
const selectedCounselorId = ref('')
const assignmentNotes = ref('')

// Counselors
const availableCounselors = ref<User[]>([])

// Toast
const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

// Computed
const stats = computed(() => {
  const activeAlerts = alerts.value.filter(a => a.status === 'pending' || a.status === 'assigned' || a.status === 'in_progress')
  const pendingAlerts = alerts.value.filter(a => a.status === 'pending')
  const resolvedToday = alerts.value.filter(a => a.status === 'resolved' && isToday(a.resolved_at))
  
  // Calculate average response time from actual data
  const assignedAlerts = alerts.value.filter(a => a.assigned_at && a.created_at)
  let avgResponseTime = 'N/A'
  
  if (assignedAlerts.length > 0) {
    const totalResponseTime = assignedAlerts.reduce((sum, alert) => {
      const created = new Date(alert.created_at).getTime()
      const assigned = new Date(alert.assigned_at!).getTime()
      return sum + (assigned - created)
    }, 0)
    
    const avgMinutes = Math.round(totalResponseTime / assignedAlerts.length / (1000 * 60))
    avgResponseTime = avgMinutes < 60 ? `${avgMinutes} min` : `${Math.round(avgMinutes / 60)} hr`
  }
  
  return {
    active: activeAlerts.length,
    pending: pendingAlerts.length,
    resolved: resolvedToday.length,
    avgResponseTime
  }
})

const filteredAlerts = computed(() => {
  let filtered = alerts.value

  if (priorityFilter.value) {
    filtered = filtered.filter(a => a.priority === priorityFilter.value)
  }

  if (statusFilter.value) {
    filtered = filtered.filter(a => a.status === statusFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(a => 
      a.client_name?.toLowerCase().includes(query) ||
      a.client_phone?.includes(query) ||
      a.description.toLowerCase().includes(query) ||
      a.location?.toLowerCase().includes(query)
    )
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case 'response_time':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      default: // created_at
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return filtered
})

// Methods
const loadAlerts = async () => {
  loading.value = true
  try {
    // Load real crisis alerts from database
    const { data, error } = await supabase
      .from('crisis_alerts')
      .select(`
        *,
        assigned_counselor:users!crisis_alerts_assigned_counselor_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading crisis alerts:', error)
      showToast('Failed to load crisis alerts from database', 'error')
      alerts.value = []
      return
    }

    alerts.value = data || []
  } catch (error: any) {
    console.error('Error loading crisis alerts:', error)
    showToast('Failed to load crisis alerts: ' + error.message, 'error')
    alerts.value = []
  } finally {
    loading.value = false
  }
}

const loadCounselors = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'counselor')
      .eq('is_active', true)

    if (error) {
      console.error('Error loading counselors:', error)
      availableCounselors.value = []
      return
    }
    
    availableCounselors.value = data || []
  } catch (error: any) {
    console.error('Failed to load counselors:', error)
    availableCounselors.value = []
  }
}

const refreshAlerts = () => {
  loadAlerts()
}

const assignCounselor = (alert: CrisisAlert) => {
  selectedAlert.value = alert
  showAssignModal.value = true
}

const confirmAssignment = async () => {
  if (!selectedAlert.value || !selectedCounselorId.value) return

  loading.value = true
  try {
    // Update crisis alert in database
    const { error } = await supabase
      .from('crisis_alerts')
      .update({
        assigned_counselor_id: selectedCounselorId.value,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .eq('id', selectedAlert.value.id)

    if (error) {
      console.error('Error assigning counselor:', error)
      showToast('Failed to assign counselor: ' + error.message, 'error')
      return
    }

    // Update local state
    const counselor = availableCounselors.value.find(c => c.id === selectedCounselorId.value)
    if (counselor) {
      selectedAlert.value.assigned_counselor = counselor
      selectedAlert.value.status = 'assigned'
      selectedAlert.value.assigned_at = new Date().toISOString()
    }

    showToast('Counselor assigned successfully!', 'success')
    closeAssignModal()
  } catch (error: any) {
    console.error('Error assigning counselor:', error)
    showToast('Failed to assign counselor: ' + error.message, 'error')
  } finally {
    loading.value = false
  }
}

const updateStatus = async (alert: CrisisAlert, newStatus: string) => {
  try {
    const updateData: any = {
      status: newStatus
    }
    
    if (newStatus === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    // Update crisis alert in database
    const { error } = await supabase
      .from('crisis_alerts')
      .update(updateData)
      .eq('id', alert.id)

    if (error) {
      console.error('Error updating status:', error)
      showToast('Failed to update status: ' + error.message, 'error')
      return
    }

    // Update local state
    alert.status = newStatus as any
    if (newStatus === 'resolved') {
      alert.resolved_at = new Date().toISOString()
    }
    
    showToast(`Alert marked as ${newStatus}`, 'success')
  } catch (error: any) {
    console.error('Error updating status:', error)
    showToast('Failed to update status: ' + error.message, 'error')
  }
}

const viewDetails = (alert: CrisisAlert) => {
  selectedAlert.value = alert
  showDetailsModal.value = true
}

const callClient = (phone: string) => {
  // In a real app, this would integrate with a calling system
  window.open(`tel:${phone}`)
}

const exportAlerts = () => {
  const dataToExport = alerts.value.map(alert => ({
    id: alert.id,
    title: alert.title,
    description: alert.description,
    priority: alert.priority,
    status: alert.status,
    client_name: alert.client_name,
    phone: alert.client_phone,
    location: alert.location,
    created_at: alert.created_at,
    assigned_counselor: alert.assigned_counselor?.name,
    resolved_at: alert.resolved_at
  }))

  const csvContent = convertToCSV(dataToExport)
  downloadCSV(csvContent, 'crisis-alerts-export.csv')
}

const convertToCSV = (data: any[]) => {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',')
  )
  
  return [headers, ...rows].join('\n')
}

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const applyFilters = () => {
  // Filters are reactive, no action needed
}

const clearFilters = () => {
  searchQuery.value = ''
  priorityFilter.value = ''
  statusFilter.value = ''
  sortBy.value = 'created_at'
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedAlert.value = null
}

const closeAssignModal = () => {
  showAssignModal.value = false
  selectedAlert.value = null
  selectedCounselorId.value = ''
  assignmentNotes.value = ''
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const formatStatus = (status: string) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatTimeAgo = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isToday = (dateString?: string) => {
  if (!dateString) return false
  const today = new Date()
  const date = new Date(dateString)
  return today.toDateString() === date.toDateString()
}

const formatSupportType = (type: string) => {
  const typeMap: Record<string, string> = {
    'abortion_access': 'Abortion Access',
    'emotional_support': 'Emotional Support',
    'financial_assistance': 'Financial Assistance',
    'travel_assistance': 'Travel Assistance',
    'legal_support': 'Legal Support',
    'safety_concerns': 'Safety Concerns'
  }
  return typeMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getSupportTypeClass = (type: string) => {
  const classMap: Record<string, string> = {
    'abortion_access': 'support-critical',
    'emotional_support': 'support-emotional',
    'financial_assistance': 'support-financial',
    'travel_assistance': 'support-travel',
    'legal_support': 'support-legal',
    'safety_concerns': 'support-safety'
  }
  return classMap[type] || 'support-default'
}

const formatContactTime = (time: string) => {
  const timeMap: Record<string, string> = {
    'morning': 'Morning (8 AM - 12 PM)',
    'afternoon': 'Afternoon (12 PM - 5 PM)',
    'evening': 'Evening (5 PM - 9 PM)',
    'asap': 'As soon as possible'
  }
  return timeMap[time] || 'Any time'
}

const getSupportTypesFromMetadata = (alert: CrisisAlert): string[] => {
  if (!alert.metadata) return []
  
  const types: string[] = []
  const metadata = alert.metadata
  
  // Extract support types from boolean fields in metadata
  if (metadata.needs_abortion_access) types.push('abortion_access')
  if (metadata.needs_emotional_support) types.push('emotional_support')
  if (metadata.needs_financial_assistance) types.push('financial_assistance')
  if (metadata.needs_travel_assistance) types.push('travel_assistance')
  if (metadata.needs_legal_support) types.push('legal_support')
  if (metadata.needs_safety_concerns) types.push('safety_concerns')
  
  // Also check for support_types array if it exists
  if (metadata.support_types && Array.isArray(metadata.support_types)) {
    types.push(...metadata.support_types)
  }
  
  return types
}

const getPreferredContactTime = (alert: CrisisAlert): string => {
  return alert.metadata?.preferred_contact_time || ''
}

// Lifecycle
onMounted(() => {
  loadAlerts()
  loadCounselors()
})
</script>

<style scoped>
.crisis-alerts {
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
  .crisis-alerts {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .crisis-alerts.sidebar-collapsed {
    left: 70px;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #B91C1C;
  margin: 0;
}

.header p {
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-card.urgent .stat-icon { background: #dc2626; }
.stat-card.high .stat-icon { background: #f59e0b; }
.stat-card.resolved .stat-icon { background: #10b981; }
.stat-card.response-time .stat-icon { background: #3b82f6; }

.stat-content h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #B91C1C;
}

.stat-content p {
  margin: 0;
  color: #666;
}

.stat-content small {
  display: block;
  font-size: 0.8rem;
  color: #666;
}

/* Filters */
.filters-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-bar i {
  color: #B91C1C;
}

.search-bar input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #F8C9C9;
  border-radius: 4px;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filters select {
  padding: 0.5rem;
  border: 1px solid #F8C9C9;
  border-radius: 4px;
}

.clear-filters-btn {
  background: none;
  border: none;
  color: #B91C1C;
  cursor: pointer;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  background: #F8C9C9;
}

/* Alert Cards */
.alerts-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-left: 4px solid #e5e7eb;
}

.alert-card.priority-critical {
  border-left-color: #dc2626;
}

.alert-card.priority-high {
  border-left-color: #f59e0b;
}

.alert-card.priority-medium {
  border-left-color: #3b82f6;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.priority-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.priority-badge.critical {
  background: #fee2e2;
  color: #dc2626;
}

.priority-badge.high {
  background: #fef3c7;
  color: #f59e0b;
}

.priority-badge.medium {
  background: #dbeafe;
  color: #3b82f6;
}

.alert-time {
  color: #666;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.alert-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.alert-details {
  flex: 1;
}

.alert-details h3 {
  margin: 0 0 0.5rem 0;
  color: #B91C1C;
}

.alert-description {
  margin: 0 0 1rem 0;
  color: #374151;
  line-height: 1.5;
}

.alert-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
  font-size: 0.875rem;
}

.meta-item i {
  width: 12px;
}

.alert-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.pending {
  background: #fef3c7;
  color: #f59e0b;
}

.status-badge.assigned {
  background: #dbeafe;
  color: #3b82f6;
}

.status-badge.in_progress {
  background: #e0e7ff;
  color: #6366f1;
}

.status-badge.resolved {
  background: #d1fae5;
  color: #10b981;
}

.assigned-to {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
  font-size: 0.875rem;
}

.alert-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-sm {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

/* Response Timeline */
.response-timeline {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.response-timeline h4 {
  margin: 0 0 1rem 0;
  color: #B91C1C;
  font-size: 1rem;
}

.response-item {
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 4px;
}

.response-time {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.response-content {
  font-size: 0.875rem;
  color: #374151;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  margin: 1rem;
  max-height: 90vh;
  overflow-y: auto;
}

.modal.large {
  max-width: 800px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #B91C1C;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Detail Sections */
.detail-section {
  margin-bottom: 2rem;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  color: #B91C1C;
  font-size: 1.1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.response-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

/* Form Styles */
.form-group {
  margin-bottom: 1rem;
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
  border: 1px solid #F8C9C9;
  border-radius: 4px;
  box-sizing: border-box;
}

/* States */
.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loading-state i {
  font-size: 2rem;
  color: #B91C1C;
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 3rem;
  color: #9CA3AF;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6B7280;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 4px;
  color: white;
  font-weight: 600;
  z-index: 2000;
}

.toast.success {
  background: #10b981;
}

.toast.error {
  background: #dc2626;
}

/* Support Types */
.support-types {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.support-types-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.support-types-label i {
  color: #6b7280;
}

.support-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.support-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.support-tag.large {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.support-tag.support-critical {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.support-tag.support-emotional {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.support-tag.support-financial {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.support-tag.support-travel {
  background: #fefce8;
  color: #ca8a04;
  border: 1px solid #fef3c7;
}

.support-tag.support-legal {
  background: #faf5ff;
  color: #7c2d12;
  border: 1px solid #e9d5ff;
}

.support-tag.support-safety {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
}

.support-tag.support-default {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.support-types-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 768px) {
  .crisis-alerts {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .alert-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .alert-status {
    align-items: flex-start;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .modal {
    margin: 0.5rem;
  }
  
  .support-tags {
    gap: 0.25rem;
  }
  
  .support-tag {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
  }
}
</style> 
 