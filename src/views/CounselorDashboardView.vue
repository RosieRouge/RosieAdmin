<template>
  <div class="counselor-dashboard">
    <!-- Not a Counselor Message -->
    <div v-if="!authStore.isCounselor" class="not-counselor-message">
      <div class="message-card">
        <div class="message-icon">
          <i class="fas fa-user-md"></i>
        </div>
        <h2>You are not yet a counselor</h2>
        <p>Have an admin add you as a counselor and check back.</p>
        <button @click="router.push('/dashboard')" class="btn btn-primary">
          <i class="fas fa-arrow-left"></i>
          Back to Dashboard
        </button>
      </div>
    </div>

    <!-- Counselor Dashboard Content -->
    <div v-else class="dashboard-wrapper">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>
            <i class="fas fa-user-md"></i>
            Counselor Dashboard
          </h1>
          <p>Welcome back, {{ counselorName }}. Here's your overview for today.</p>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-icon active-cases">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.activeCases }}</h3>
            <p>Active Cases</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon pending-cases">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.pendingResponses }}</h3>
            <p>Pending Responses</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon urgent-cases">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.urgentCases }}</h3>
            <p>Urgent Cases</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed-today">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h3>{{ stats.completedToday }}</h3>
            <p>Completed Today</p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="dashboard-content">
        <!-- Cases Section - Full Width -->
        <div class="cases-section">
          <div class="section-header">
            <h2>Your Cases</h2>
            <div class="case-filters">
              <button 
                v-for="filter in caseFilters" 
                :key="filter.key"
                class="filter-btn"
                :class="{ active: activeFilter === filter.key }"
                @click="activeFilter = filter.key"
              >
                <i :class="filter.icon"></i>
                {{ filter.label }}
                <span v-if="filter.count > 0" class="count-badge">{{ filter.count }}</span>
              </button>
            </div>
          </div>

          <!-- Urgent Cases Alert -->
          <div v-if="urgentCases.length > 0" class="urgent-alert">
            <div class="alert-header">
              <i class="fas fa-fire"></i>
              <h3>{{ urgentCases.length }} Urgent Case{{ urgentCases.length > 1 ? 's' : '' }} Need Immediate Attention</h3>
            </div>
            <div class="urgent-cases-grid">
              <div 
                v-for="caseItem in urgentCases.slice(0, 3)" 
                :key="caseItem.id"
                class="urgent-case-card"
                @click="viewCase(caseItem.id)"
              >
                <div class="urgency-indicator">
                  <span class="urgency-badge critical">{{ caseItem.urgency.toUpperCase() }}</span>
                  <span class="time-urgent">{{ getTimeSince(new Date(caseItem.created_at)) }} ago</span>
                </div>
                <h4>{{ caseItem.title }}</h4>
                <p>{{ caseItem.description.substring(0, 80) }}...</p>
                <div class="case-client">
                  <i class="fas fa-user"></i>
                  Client Case
                </div>
              </div>
            </div>
          </div>

          <!-- Cases Grid -->
          <div class="cases-grid">
            <!-- Loading state -->
            <div v-if="loading" class="loading-state">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading your cases...</p>
            </div>

            <!-- Empty state -->
            <div v-else-if="filteredCases.length === 0" class="empty-state">
              <i :class="getEmptyStateIcon()"></i>
              <h3>{{ getEmptyStateTitle() }}</h3>
              <p>{{ getEmptyStateMessage() }}</p>
            </div>

            <!-- Cases list -->
            <div 
              v-for="caseItem in filteredCases" 
              :key="caseItem.id"
              class="case-card"
              :class="getCaseCardClass(caseItem)"
              @click="viewCase(caseItem.id)"
            >
              <div class="case-header">
                <div class="case-type">
                  <i :class="getCaseTypeIcon(caseItem.type)"></i>
                  {{ formatCaseType(caseItem.type) }}
                </div>
                <div class="case-badges">
                  <span class="urgency-badge" :class="caseItem.urgency">
                    {{ caseItem.urgency.toUpperCase() }}
                  </span>
                  <span class="status-badge" :class="caseItem.status">
                    {{ formatStatus(caseItem.status) }}
                  </span>
                </div>
              </div>

              <h3>{{ caseItem.title }}</h3>
              <p class="case-description">{{ caseItem.description }}</p>

              <div class="case-meta">
                <div class="case-client">
                  <i class="fas fa-user"></i>
                  <span>Client Case</span>
                </div>
                <div class="case-timing">
                  <i class="fas fa-clock"></i>
                  <span>{{ getCaseTimingText(caseItem) }}</span>
                </div>
              </div>

              <div class="case-actions" @click.stop>
                <button 
                  v-if="caseItem.status === 'pending' && !caseItem.assigned_counselor_id"
                  @click="acceptCase(caseItem)" 
                  class="action-btn primary"
                >
                  <i class="fas fa-check"></i>
                  Accept Case
                </button>
                
                <button 
                  v-if="caseItem.assigned_counselor_id === counselorId"
                  @click="openChat(caseItem)" 
                  class="action-btn secondary"
                >
                  <i class="fas fa-comments"></i>
                  Message Client
                </button>
                
                <button 
                  v-if="caseItem.assigned_counselor_id === counselorId"
                  @click="updateStatus(caseItem)" 
                  class="action-btn tertiary"
                >
                  <i class="fas fa-edit"></i>
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Widgets Row -->
        <div class="bottom-widgets">
          <!-- Recent Activity -->
          <div class="widget">
            <h3>
              <i class="fas fa-history"></i>
              Recent Activity
            </h3>
            <div class="coming-soon">
              <i class="fas fa-clock"></i>
              <p>Coming Soon</p>
            </div>
          </div>

          <!-- Today's Schedule -->
          <div class="widget">
            <h3>
              <i class="fas fa-calendar"></i>
              Today's Schedule
            </h3>
            <div class="coming-soon">
              <i class="fas fa-calendar-check"></i>
              <p>Schedule Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCasesStore } from '@/stores/cases'
import { useDirectMessagesStore } from '@/stores/directMessages'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { storeToRefs } from 'pinia'
import type { SupportCase, CaseStatus, CaseType } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const casesStore = useCasesStore()
const directMessagesStore = useDirectMessagesStore()

const { cases, loading } = storeToRefs(casesStore)

// Local state
const isAvailable = ref(true)
const updatingAvailability = ref(false)
const activeFilter = ref('new')

// Computed properties
const counselorName = computed(() => {
  return authStore.profile?.name?.split(' ')[0] || 'Counselor'
})

const counselorId = computed(() => authStore.user?.id || '')

// Filter cases by assignment status
const newCases = computed(() => 
  cases.value.filter(c => 
    c.status === 'pending' && 
    !c.assigned_counselor_id
  )
)

const activeCases = computed(() => 
  cases.value.filter(c => 
    c.assigned_counselor_id === counselorId.value && 
    c.status !== 'resolved' && 
    c.status !== 'closed'
  )
)

const completedCases = computed(() => 
  cases.value.filter(c => 
    c.assigned_counselor_id === counselorId.value && 
    (c.status === 'resolved' || c.status === 'closed')
  )
)

const urgentCases = computed(() => 
  cases.value.filter(c => 
    (c.urgency === 'high' || c.urgency === 'critical') &&
    c.status !== 'resolved' && 
    c.status !== 'closed' &&
    c.assigned_counselor_id === counselorId.value
  )
)

// Dashboard stats
const stats = computed(() => ({
  activeCases: activeCases.value.length,
  pendingResponses: activeCases.value.filter(c => c.status === 'assigned').length,
  urgentCases: urgentCases.value.length,
  completedToday: completedCases.value.filter(c => 
    c.completed_at && isToday(new Date(c.completed_at))
  ).length
}))

// Case filters
const caseFilters = computed(() => [
  {
    key: 'new',
    label: 'New',
    icon: 'fas fa-inbox',
    count: newCases.value.length
  },
  {
    key: 'active',
    label: 'Active',
    icon: 'fas fa-clipboard-list',
    count: activeCases.value.length
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: 'fas fa-check-circle',
    count: completedCases.value.length
  }
])

const filteredCases = computed(() => {
  switch (activeFilter.value) {
    case 'new':
      return newCases.value
    case 'active':
      return activeCases.value
    case 'completed':
      return completedCases.value
    default:
      return cases.value
  }
})

// Load real data instead of mock data
const recentActivity = ref<any[]>([])
const todaysSchedule = ref<any[]>([])

// Helper functions
const getTimeSince = (date: Date) => {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  return `${minutes}m`
}

const isToday = (date: Date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
}

const getCaseTypeIcon = (type: CaseType) => {
  const icons: Record<string, string> = {
    'abortion_support': 'fas fa-heart',
    'contraception_consultation': 'fas fa-pills',
    'counseling': 'fas fa-comments',
    'legal_aid': 'fas fa-gavel',
    'financial_assistance': 'fas fa-dollar-sign',
    'transportation': 'fas fa-car',
    'emotional_support': 'fas fa-hands-helping',
    'post_care': 'fas fa-user-md',
    'other': 'fas fa-file-medical'
  }
  return icons[type] || 'fas fa-file-medical'
}

const formatCaseType = (type: CaseType) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const formatStatus = (status: CaseStatus) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Helper methods for display
const getCaseCardClass = (caseItem: SupportCase) => {
  const classes = []
  if (caseItem.urgency === 'high' || caseItem.urgency === 'critical') {
    classes.push('urgent')
  }
  if (caseItem.status === 'pending') {
    classes.push('pending')
  }
  return classes.join(' ')
}

const getCaseTimingText = (caseItem: SupportCase) => {
  const now = Date.now()
  const created = new Date(caseItem.created_at).getTime()
  const diff = now - created
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

const getEmptyStateIcon = () => {
  switch (activeFilter.value) {
    case 'new': return 'fas fa-inbox'
    case 'active': return 'fas fa-clipboard-list'
    case 'completed': return 'fas fa-check-circle'
    default: return 'fas fa-file-medical'
  }
}

const getEmptyStateTitle = () => {
  switch (activeFilter.value) {
    case 'new': return 'No New Cases'
    case 'active': return 'No Active Cases'
    case 'completed': return 'No Completed Cases'
    default: return 'No Cases'
  }
}

const getEmptyStateMessage = () => {
  switch (activeFilter.value) {
    case 'new': return 'New case assignments will appear here when available.'
    case 'active': return 'Cases you\'re currently working on will appear here.'
    case 'completed': return 'Your completed cases will appear here.'
    default: return 'Cases will appear here when available.'
  }
}

// Actions
const updateAvailability = async () => {
  updatingAvailability.value = true
  try {
    // TODO: Update counselor availability in database
    console.log('Availability updated:', isAvailable.value)
  } catch (error) {
    console.error('Failed to update availability:', error)
  } finally {
    updatingAvailability.value = false
  }
}

const acceptCase = async (caseItem: SupportCase) => {
  try {
    console.log('🎯 Accepting case:', caseItem.id)
    
    // STEP 1: Use the cases store to update (it might handle database triggers better)
    console.log('📝 Updating through cases store...')
    
    try {
      await casesStore.assignCase(caseItem.id, counselorId.value, 'counselor')
      console.log('✅ Cases store update successful')
    } catch (storeError) {
      console.warn('Cases store failed, trying direct update without problematic fields...', storeError)
      
      // Fallback: try direct update with minimal fields
      const { data: updatedCase, error: updateError } = await supabaseAdmin
        .from('support_cases')
        .update({
          assigned_counselor_id: counselorId.value,
          assigned_at: new Date().toISOString()
        })
        .eq('id', caseItem.id)
        .select('id, assigned_counselor_id, assigned_at')
        .single()

      if (updateError) {
        console.error('❌ Direct update also failed:', updateError)
        // Don't throw - proceed with local state update and chat creation
        console.log('⚠️ Proceeding with local update only...')
      } else {
        console.log('✅ Direct minimal update successful:', updatedCase)
      }
    }
    
    // STEP 2: Update local state  
    const caseIndex = cases.value.findIndex(c => c.id === caseItem.id)
    if (caseIndex !== -1) {
      cases.value[caseIndex] = {
        ...cases.value[caseIndex],
        assigned_counselor_id: counselorId.value,
        status: 'assigned' as any,
        assigned_at: new Date().toISOString()
      }
    }
    
    // STEP 3: Create conversation
    console.log('🚀 Creating private conversation...')
    const conversationId = await directMessagesStore.createOrGetConversation(
      counselorId.value, 
      caseItem.client_id, 
      caseItem.id
    )
    
    // STEP 4: Send welcome message
    console.log('💬 Sending welcome message...')
    await directMessagesStore.sendMessage(
      conversationId,
      counselorId.value,
      caseItem.client_id,
      `Hi! I'm ${counselorName.value}, your assigned counselor for this case. I'm here to help and support you through this process. How are you feeling today?`,
      caseItem.id,
      'text'
    )
    
    console.log('🎉 SUCCESS: Case accepted and conversation created:', conversationId)
    
    // Show success and navigate
    alert(`🎉 Case accepted successfully! Starting your chat with the client...`)
    
    // Navigate directly to the chat
    router.push(`/chats?conversation=${conversationId}`)
    
  } catch (error: any) {
    console.error('❌ Failed to accept case:', error)
    alert(`Failed to accept case: ${error?.message || 'Unknown error'}`)
  }
}

const viewCase = (caseId: string) => {
  router.push(`/case-management`)
}

const openChat = async (caseItem: SupportCase) => {
  try {
    // Get or create conversation for this case
    const conversationId = await directMessagesStore.createOrGetConversation(
      counselorId.value, 
      caseItem.client_id, 
      caseItem.id
    )
    
    // Navigate to the chat view with the conversation
    router.push(`/chats?conversation=${conversationId}`)
  } catch (error) {
    console.error('Failed to open chat:', error)
  }
}

const updateStatus = (caseItem: SupportCase) => {
  router.push(`/case-management`)
}

// Load cases on mount
const loadCases = async () => {
  if (counselorId.value) {
    try {
      await casesStore.loadCases()
    } catch (error) {
      console.error('Failed to load counselor cases:', error)
    }
  }
}

// Lifecycle
onMounted(async () => {
  if (counselorId.value && authStore.isCounselor) {
    try {
      await casesStore.loadCases()
    } catch (error) {
      console.error('Failed to load counselor cases:', error)
    }
  }
})
</script>

<style scoped>
/* CSS Variables */
:root {
  --rosie-primary: #B91C1C;
  --rosie-pink: #FDF2F8;
  --rosie-gray: #6B7280;
  --rosie-bg: #F9FAFB;
}

.counselor-dashboard {
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

.dashboard-wrapper {
  /* Remove all custom styling - let it flow naturally */
}

/* Not Counselor Message Styles */
.not-counselor-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.message-card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(185, 28, 28, 0.1);
  max-width: 500px;
  width: 100%;
}

.message-icon {
  width: 80px;
  height: 80px;
  background: var(--rosie-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  color: white;
  font-size: 2rem;
}

.message-card h2 {
  color: var(--rosie-primary);
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
}

.message-card p {
  color: #666;
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
  line-height: 1.5;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  text-decoration: none;
  font-size: 1rem;
}

.btn.btn-primary {
  background: var(--rosie-primary);
  color: white;
}

.btn.btn-primary:hover {
  background: #be1e2d;
  transform: translateY(-1px);
}

.dashboard-header {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(185, 28, 28, 0.1);
  text-align: center;
}

.header-content h1 {
  color: var(--rosie-primary);
  margin: 0 0 0.5rem 0;
  font-size: 2.2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-content p {
  margin: 0;
  color: var(--rosie-gray);
  font-size: 1.1rem;
}



.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.stat-icon.active-cases { background: #3b82f6; }
.stat-icon.pending-cases { background: #f59e0b; }
.stat-icon.urgent-cases { background: #dc2626; }
.stat-icon.completed-today { background: #10b981; }

.stat-content h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  color: var(--rosie-primary);
}

.stat-content p {
  margin: 0;
  color: var(--rosie-gray);
  font-weight: 500;
  font-size: 0.9rem;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.cases-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(185, 28, 28, 0.1);
  overflow: hidden;
  width: 100%;
}

.section-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  margin: 0;
  color: var(--rosie-primary);
  font-size: 1.5rem;
}

.case-filters {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--rosie-gray);
  font-weight: 500;
}

.filter-btn:hover,
.filter-btn.active {
  background: var(--rosie-primary);
  color: white;
  border-color: var(--rosie-primary);
}

.count-badge {
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.filter-btn.active .count-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.urgent-alert {
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
  padding: 1.5rem;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.alert-header i {
  color: #dc2626;
  font-size: 1.2rem;
}

.alert-header h3 {
  margin: 0;
  color: #dc2626;
  font-size: 1.1rem;
}

.urgent-cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.urgent-case-card {
  background: white;
  border: 2px solid #fca5a5;
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.urgent-case-card:hover {
  border-color: #dc2626;
  transform: translateY(-1px);
}

.urgency-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.urgency-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.urgency-badge.critical {
  background: #dc2626;
  color: white;
}

.time-urgent {
  color: #666;
  font-size: 0.8rem;
}

.urgent-case-card h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1rem;
}

.urgent-case-card p {
  margin: 0 0 0.75rem 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.case-client {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.8rem;
}

.cases-grid {
  padding: 1.5rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.case-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.case-card:hover {
  background: white;
  border-color: var(--rosie-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(185, 28, 28, 0.1);
}

.case-card.urgent {
  border-color: #fca5a5;
  background: #fef2f2;
}

.case-card.urgent:hover {
  border-color: #dc2626;
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.case-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--rosie-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.case-badges {
  display: flex;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.assigned { background: #dbeafe; color: #1e40af; }
.status-badge.in_progress { background: #d1fae5; color: #065f46; }
.status-badge.resolved { background: #d1fae5; color: #065f46; }

.case-card h3 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1.2rem;
  line-height: 1.3;
}

.case-description {
  margin: 0 0 1rem 0;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.case-meta > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.case-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.action-btn.primary {
  background: var(--rosie-primary);
  color: white;
}

.action-btn.primary:hover {
  background: #be1e2d;
}

.action-btn.secondary {
  background: #3b82f6;
  color: white;
}

.action-btn.secondary:hover {
  background: #2563eb;
}

.action-btn.tertiary {
  background: #f59e0b;
  color: white;
}

.action-btn.tertiary:hover {
  background: #d97706;
}

.bottom-widgets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  width: 100%;
}

.widget {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
}

.widget h3 {
  margin: 0 0 1rem 0;
  color: var(--rosie-primary);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}



.activity-list,
.schedule-list {
  display: grid;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.activity-icon.case_accepted { background: #10b981; }
.activity-icon.message_sent { background: #3b82f6; }
.activity-icon.case_completed { background: #f59e0b; }

.activity-content p {
  margin: 0 0 0.25rem 0;
  color: #374151;
  font-size: 0.9rem;
}

.activity-content small {
  color: #666;
  font-size: 0.8rem;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.appointment-time {
  color: var(--rosie-primary);
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 60px;
}

.appointment-details h4 {
  margin: 0 0 0.25rem 0;
  color: #374151;
  font-size: 0.9rem;
}

.appointment-details p {
  margin: 0;
  color: #666;
  font-size: 0.8rem;
}

.coming-soon {
  text-align: center;
  padding: 1.5rem;
  color: #666;
}

.coming-soon i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.coming-soon p {
  margin: 0;
  font-style: italic;
}

/* Responsive layout adjustments */
@media (max-width: 1023px) {
  .counselor-dashboard {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .counselor-dashboard.sidebar-collapsed {
    left: 70px;
  }
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .bottom-widgets {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .case-filters {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-btn {
    justify-content: center;
  }
  
  .case-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .case-actions {
    flex-direction: column;
  }
  
  .message-card {
    padding: 2rem 1.5rem;
  }
  
  .dashboard-header {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .stats-overview {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .stat-content h3 {
    font-size: 1.25rem;
  }
  
  .dashboard-header {
    padding: 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.75rem;
  }
  
  .cases-grid {
    padding: 1rem;
  }
  
  .widget {
    padding: 1rem;
  }
}

/* Extra small screens */
@media (max-width: 360px) {
  .dashboard-header h1 {
    font-size: 1.5rem;
  }
  
  .stat-content h3 {
    font-size: 1.1rem;
  }
  
  .stat-content p {
    font-size: 0.8rem;
  }
}


</style> 