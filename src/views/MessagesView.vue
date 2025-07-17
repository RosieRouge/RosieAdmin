<template>
  <div class="messages-view">
    <!-- Header with Actions -->
    <div class="header-section">
      <div class="header-left">
        <h2>Message Moderation</h2>
        <p>Monitor and moderate user messages across all communities</p>
      </div>
      <div class="header-actions">
        <button @click="showAutoModModal = true" class="btn secondary">
          <i class="fas fa-gear"></i>
          <span class="btn-text">Auto-Mod Rules</span>
        </button>
        <button @click="exportMessages" class="btn secondary">
          <i class="fas fa-download"></i>
          <span class="btn-text">Export</span>
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card total">
        <div class="stat-icon">
          <i class="fas fa-envelope"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalMessages }}</h3>
          <p>Total Messages</p>
          <span class="stat-change">{{ messagestoday }} sent today</span>
        </div>
      </div>
      
      <div class="stat-card flagged">
        <div class="stat-icon">
          <i class="fas fa-flag"></i>
        </div>
        <div class="stat-info">
          <h3>{{ flaggedMessages }}</h3>
          <p>Flagged Messages</p>
          <span class="stat-change warning">{{ pendingReview }} pending review</span>
        </div>
      </div>
      
      <div class="stat-card hidden">
        <div class="stat-icon">
          <i class="fas fa-eye-slash"></i>
        </div>
        <div class="stat-info">
          <h3>{{ hiddenMessages }}</h3>
          <p>Hidden Messages</p>
          <span class="stat-change">{{ hiddenToday }} hidden today</span>
        </div>
      </div>

      <div class="stat-card spam">
        <div class="stat-icon">
          <i class="fas fa-shield"></i>
        </div>
        <div class="stat-info">
          <h3>{{ autoModerated }}</h3>
          <p>Auto-Moderated</p>
          <span class="stat-change positive">{{ spamBlocked }}% blocked</span>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search messages by content, author, or community..."
        >
      </div>
      
      <div class="filters">
        <select v-model="statusFilter" @change="applyFilters">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
          <option value="deleted">Deleted</option>
          <option value="flagged">Flagged</option>
          <option value="pending">Pending Review</option>
        </select>
        
        <select v-model="communityFilter" @change="applyFilters">
          <option value="">All Communities</option>
          <option v-for="community in communities" :key="community.id" :value="community.id">
            {{ community.name }}
          </option>
        </select>
        
        <select v-model="sortBy" @change="applyFilters">
          <option value="created_at">Newest First</option>
          <option value="flagged_at">Recently Flagged</option>
          <option value="user_reports">Most Reported</option>
          <option value="author">Author A-Z</option>
        </select>

        <button @click="clearFilters" class="clear-filters-btn">
          <i class="fas fa-times"></i>
          <span>Clear</span>
        </button>
      </div>
    </div>

    <!-- Messages Content -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading messages...</p>
    </div>

    <div v-else-if="messages.length === 0" class="empty-state">
      <i class="fas fa-envelope"></i>
      <h3>No Messages Found</h3>
      <p>No messages match your current filters.</p>
    </div>

    <div v-else class="messages-content">
      <!-- Bulk Actions -->
      <div v-if="selectedMessages.length > 0" class="bulk-actions">
        <div class="bulk-info">
          {{ selectedMessages.length }} message{{ selectedMessages.length > 1 ? 's' : '' }} selected
        </div>
        <div class="bulk-buttons">
          <button @click="bulkAction('hide')" class="btn warning">
            <i class="fas fa-eye-slash"></i>
            <span>Hide</span>
          </button>
          <button @click="bulkAction('show')" class="btn success">
            <i class="fas fa-eye"></i>
            <span>Show</span>
          </button>
          <button @click="bulkAction('delete')" class="btn danger">
            <i class="fas fa-trash"></i>
            <span>Delete</span>
          </button>
        </div>
      </div>

      <!-- Messages List -->
      <div class="messages-list">
        <div class="messages-header">
          <div class="select-all">
            <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
            <span>Select All</span>
          </div>
          <div class="view-options">
            <span class="message-count">{{ filteredMessages.length }} messages</span>
          </div>
        </div>

        <div v-for="message in paginatedMessages" :key="message.id" class="message-item" :class="{ flagged: message.status === 'flagged', hidden: message.status === 'hidden' }">
          <div class="message-select">
            <input type="checkbox" v-model="selectedMessages" :value="message.id">
          </div>

          <div class="message-content">
            <div class="message-header">
              <div class="author-info">
                <img :src="message.users?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'" :alt="message.users?.name" class="author-avatar">
                <div class="author-details">
                  <div class="author-name">{{ message.users?.name }}</div>
                  <div class="community-name">in {{ message.communities?.name }}</div>
                </div>
              </div>
              
              <div class="message-meta">
                <span class="message-date">{{ formatDate(message.created_at) }}</span>
                <span class="status-badge" :class="message.status">{{ message.status }}</span>
              </div>
            </div>

            <div class="message-body">
              <p class="message-text">{{ message.content }}</p>
              
              <div v-if="message.attachments && message.attachments.length > 0" class="message-attachments">
                <div v-for="attachment in message.attachments" :key="attachment" class="attachment">
                  <i class="fas fa-file"></i>
                  <span>{{ getAttachmentName(attachment) }}</span>
                </div>
              </div>
            </div>

            <div class="message-footer">
              <div class="message-stats">
                <span class="stat">
                  <i class="fas fa-flag"></i>
                  {{ message.report_count || 0 }} reports
                </span>
                <span class="stat">
                  <i class="fas fa-heart"></i>
                  {{ message.like_count || 0 }} likes
                </span>
                <span class="stat">
                  <i class="fas fa-comment"></i>
                  {{ message.reply_count || 0 }} replies
                </span>
              </div>
              
              <div class="message-actions">
                <button @click="viewMessage(message)" class="action-btn view" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="viewReports(message)" class="action-btn reports" title="View Reports" v-if="message.report_count > 0">
                  <i class="fas fa-flag"></i>
                </button>
                <button @click="toggleMessageStatus(message)" class="action-btn" :class="getStatusActionClass(message)" :title="getStatusActionTitle(message)">
                  <i class="fas" :class="getStatusActionIcon(message)"></i>
                </button>
                <button @click="deleteMessage(message)" class="action-btn danger" title="Delete Message">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div v-if="message.admin_note" class="admin-note">
              <i class="fas fa-user-shield"></i>
              <span>{{ message.admin_note }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <div class="pagination-info">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredMessages.length) }} of {{ filteredMessages.length }} messages
        </div>
        <div class="pagination-controls">
          <button 
            @click="currentPage = Math.max(1, currentPage - 1)" 
            :disabled="currentPage === 1"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <span class="page-numbers">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              @click="currentPage = page"
              :class="{ active: page === currentPage }"
              class="page-btn"
            >
              {{ page }}
            </button>
          </span>
          
          <button 
            @click="currentPage = Math.min(totalPages, currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

// Component state
const loading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('')
const communityFilter = ref('')
const sortBy = ref('created_at')
const currentPage = ref(1)
const itemsPerPage = ref(20)
const selectAll = ref(false)
const selectedMessages = ref<string[]>([])
const showAutoModModal = ref(false)

// Data
const messages = ref<any[]>([])
const communities = ref<any[]>([])

// Stats
const totalMessages = ref(0)
const flaggedMessages = ref(0)
const hiddenMessages = ref(0)
const autoModerated = ref(0)
const messagestoday = ref(0)
const pendingReview = ref(0)
const hiddenToday = ref(0)
const spamBlocked = ref(0)

onMounted(async () => {
  await Promise.all([
    loadMessages(),
    loadCommunities(),
    loadStats()
  ])
})

const loadMessages = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users (name, avatar),
        communities (name),
        message_reports (count)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading messages:', error)
    } else {
      messages.value = data || []
    }
  } catch (error) {
    console.error('Error loading messages:', error)
  } finally {
    loading.value = false
  }
}

const loadCommunities = async () => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
    
    if (error) {
      console.error('Error loading communities:', error)
    } else {
      communities.value = data || []
    }
  } catch (error) {
    console.error('Error loading communities:', error)
  }
}

const loadStats = async () => {
  try {
    const { data: messageStats } = await supabase
      .from('messages')
      .select('status, created_at, report_count')
    
    if (messageStats) {
      totalMessages.value = messageStats.length
      flaggedMessages.value = messageStats.filter(m => m.status === 'flagged').length
      hiddenMessages.value = messageStats.filter(m => m.status === 'hidden').length
      pendingReview.value = messageStats.filter(m => m.status === 'pending').length
      
      // Today's stats
      const today = new Date().toDateString()
      messagestoday.value = messageStats.filter(m => 
        new Date(m.created_at).toDateString() === today
      ).length
      hiddenToday.value = messageStats.filter(m => 
        m.status === 'hidden' && new Date(m.created_at).toDateString() === today
      ).length
      
      // Calculate real auto-moderation stats from database
      autoModerated.value = messageStats.filter(m => m.status === 'flagged').length
      spamBlocked.value = messageStats.filter(m => m.status === 'hidden').length
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// Computed properties
const filteredMessages = computed(() => {
  let result = messages.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(message => 
      message.content.toLowerCase().includes(query) ||
      message.users?.name.toLowerCase().includes(query) ||
      message.communities?.name.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    result = result.filter(message => message.status === statusFilter.value)
  }

  if (communityFilter.value) {
    result = result.filter(message => message.community_id === communityFilter.value)
  }

  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'flagged_at':
        return new Date(b.flagged_at || b.created_at).getTime() - new Date(a.flagged_at || a.created_at).getTime()
      case 'user_reports':
        return (b.report_count || 0) - (a.report_count || 0)
      case 'author':
        return (a.users?.name || '').localeCompare(b.users?.name || '')
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredMessages.value.length / itemsPerPage.value))

const paginatedMessages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredMessages.value.slice(start, end)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const applyFilters = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  communityFilter.value = ''
  sortBy.value = 'created_at'
  currentPage.value = 1
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedMessages.value = paginatedMessages.value.map(message => message.id)
  } else {
    selectedMessages.value = []
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getAttachmentName = (attachment: string) => {
  return attachment.split('/').pop() || 'Attachment'
}

const getStatusActionClass = (message: any) => {
  switch (message.status) {
    case 'flagged': return 'success'
    case 'published': return 'warning'
    case 'hidden': return 'success'
    case 'pending': return 'success'
    default: return 'secondary'
  }
}

const getStatusActionIcon = (message: any) => {
  switch (message.status) {
    case 'flagged': return 'fa-check'
    case 'published': return 'fa-eye-slash'
    case 'hidden': return 'fa-eye'
    case 'pending': return 'fa-check'
    default: return 'fa-cog'
  }
}

const getStatusActionTitle = (message: any) => {
  switch (message.status) {
    case 'flagged': return 'Approve Message'
    case 'published': return 'Hide Message'
    case 'hidden': return 'Show Message'
    case 'pending': return 'Approve Message'
    default: return 'Manage Status'
  }
}

const viewMessage = (message: any) => {
  console.log('View message:', message)
  // Navigate to message detail view
}

const viewReports = (message: any) => {
  console.log('View reports for:', message)
  // Open reports modal
}

const toggleMessageStatus = async (message: any) => {
  let newStatus = 'published'
  
  switch (message.status) {
    case 'flagged':
    case 'pending':
      newStatus = 'published'
      break
    case 'published':
      newStatus = 'hidden'
      break
    case 'hidden':
      newStatus = 'published'
      break
  }
  
  try {
    const { error } = await supabase
      .from('messages')
      .update({ 
        status: newStatus, 
        moderated_at: new Date().toISOString(),
        moderated_by: 'current_admin_id' // Replace with actual admin ID
      })
      .eq('id', message.id)
    
    if (error) {
      console.error('Error updating message status:', error)
      alert('Failed to update message status')
      return
    }
    
    // Update local data
    const index = messages.value.findIndex(m => m.id === message.id)
    if (index !== -1) {
      messages.value[index].status = newStatus
    }
    
    // Reload stats
    await loadStats()
    
  } catch (error) {
    console.error('Error updating message status:', error)
    alert('Failed to update message status')
  }
}

const deleteMessage = async (message: any) => {
  if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
    return
  }
  
  try {
    const { error } = await supabase
      .from('messages')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        deleted_by: 'current_admin_id' // Replace with actual admin ID
      })
      .eq('id', message.id)
    
    if (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
      return
    }
    
    // Remove from local data
    messages.value = messages.value.filter(m => m.id !== message.id)
    
    // Reload stats
    await loadStats()
    
  } catch (error) {
    console.error('Error deleting message:', error)
    alert('Failed to delete message')
  }
}

const bulkAction = async (action: string) => {
  if (selectedMessages.value.length === 0) return
  
  const confirmMsg = `Are you sure you want to ${action} ${selectedMessages.value.length} message(s)?`
  if (!confirm(confirmMsg)) return
  
  let updateData: any = {}
  
  switch (action) {
    case 'hide':
      updateData = { status: 'hidden', moderated_at: new Date().toISOString() }
      break
    case 'show':
      updateData = { status: 'published', moderated_at: new Date().toISOString() }
      break
    case 'delete':
      updateData = { status: 'deleted', deleted_at: new Date().toISOString() }
      break
  }
  
  try {
    const { error } = await supabase
      .from('messages')
      .update(updateData)
      .in('id', selectedMessages.value)
    
    if (error) {
      console.error(`Error ${action}ing messages:`, error)
      alert(`Failed to ${action} messages`)
      return
    }
    
    // Update local data
    selectedMessages.value.forEach(messageId => {
      const index = messages.value.findIndex(m => m.id === messageId)
      if (index !== -1) {
        if (action === 'delete') {
          messages.value.splice(index, 1)
        } else {
          messages.value[index].status = updateData.status
        }
      }
    })
    
    selectedMessages.value = []
    selectAll.value = false
    
    // Reload stats
    await loadStats()
    
  } catch (error) {
    console.error(`Error ${action}ing messages:`, error)
    alert(`Failed to ${action} messages`)
  }
}

const exportMessages = () => {
  console.log('Export messages')
  // Implement export functionality
}
</script>

<style scoped>
.messages-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.header p {
  margin: 0;
  color: #7f8c8d;
}

.coming-soon {
  background: white;
  padding: 4rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.coming-soon i {
  font-size: 4rem;
  color: #bdc3c7;
  margin-bottom: 1rem;
}

.coming-soon h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.coming-soon p {
  color: #7f8c8d;
}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .messages-view {
    gap: 1.5rem;
  }
  
  .header {
    padding: 1.5rem;
  }
  
  .header h2 {
    font-size: 1.25rem;
  }
  
  .header p {
    font-size: 0.9rem;
  }
  
  .coming-soon {
    padding: 3rem 1.5rem;
  }
  
  .coming-soon i {
    font-size: 3rem;
  }
  
  .coming-soon h3 {
    font-size: 1.25rem;
  }
  
  .coming-soon p {
    font-size: 0.9rem;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .messages-view {
    gap: 1rem;
  }
  
  .header {
    padding: 1rem;
  }
  
  .header h2 {
    font-size: 1.1rem;
  }
  
  .coming-soon {
    padding: 2rem 1rem;
  }
  
  .coming-soon i {
    font-size: 2.5rem;
  }
  
  .coming-soon h3 {
    font-size: 1.1rem;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .header,
  .coming-soon {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
</style> 