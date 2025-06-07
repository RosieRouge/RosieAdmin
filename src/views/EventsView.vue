<template>
  <div class="events-view">
    <!-- Header with Actions -->
    <div class="header-section">
      <div class="header-left">
        <h2>Event Management</h2>
        <p>Manage community events and activities</p>
      </div>
      <div class="header-actions">
        <button @click="showCategoryModal = true" class="btn secondary">
          <i class="fas fa-tags"></i>
          <span class="btn-text">Categories</span>
        </button>
        <button @click="exportEvents" class="btn secondary">
          <i class="fas fa-download"></i>
          <span class="btn-text">Export</span>
        </button>
        <button @click="showCreateEventModal = true" class="btn primary">
          <i class="fas fa-plus"></i>
          <span class="btn-text">Create Event</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card total">
        <div class="stat-icon">
          <i class="fas fa-calendar"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalEvents }}</h3>
          <p>Total Events</p>
          <span class="stat-change">{{ pendingEvents }} pending approval</span>
        </div>
      </div>

      <div class="stat-card published">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <h3>{{ publishedEvents }}</h3>
          <p>Published</p>
          <span class="stat-change positive">+{{ Math.floor(publishedEvents * 0.1) }} this week</span>
        </div>
      </div>

      <div class="stat-card upcoming">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <h3>{{ upcomingEvents }}</h3>
          <p>Upcoming</p>
          <span class="stat-change">Next: {{ nextEventDate }}</span>
        </div>
      </div>

      <div class="stat-card attendees">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalAttendees }}</h3>
          <p>Total Attendees</p>
          <span class="stat-change positive">{{ avgAttendeesPerEvent }} avg per event</span>
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
          placeholder="Search events by title, description, or location..."
        >
      </div>
      
      <div class="filters">
        <select v-model="statusFilter" @change="applyFilters">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="hidden">Hidden</option>
        </select>
        
        <select v-model="categoryFilter" @change="applyFilters">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        
        <select v-model="sortBy" @change="applyFilters">
          <option value="created_at">Newest First</option>
          <option value="start_time">Event Date</option>
          <option value="title">Title A-Z</option>
          <option value="attendee_count">Most Popular</option>
        </select>

        <button @click="clearFilters" class="clear-filters-btn">
          <i class="fas fa-times"></i>
          <span>Clear</span>
        </button>
      </div>
    </div>

    <!-- Events Content -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading events...</p>
    </div>

    <div v-else-if="events.length === 0" class="empty-state">
      <i class="fas fa-calendar"></i>
      <h3>No Events Found</h3>
      <p>No events have been created yet. Start by creating your first event!</p>
      <button @click="showCreateEventModal = true" class="btn primary">
        <i class="fas fa-plus"></i>
        Create First Event
      </button>
    </div>

    <div v-else class="events-content">
      <!-- Events Grid -->
      <div class="events-grid">
        <div v-for="event in paginatedEvents" :key="event.id" class="event-card">
          <div class="event-image">
            <img v-if="event.images && event.images.length > 0" :src="event.images[0]" :alt="event.title">
            <div v-else class="image-placeholder">
              <i class="fas fa-calendar"></i>
            </div>
            
            <div class="event-badges">
              <span class="status-badge" :class="event.status">{{ event.status }}</span>
              <span v-if="event.is_recurring" class="recurring-badge">
                <i class="fas fa-repeat"></i>
                Recurring
              </span>
            </div>
          </div>

          <div class="event-content">
            <div class="event-header">
              <h3 class="event-title">{{ event.title }}</h3>
              <div class="event-actions">
                <button @click="viewEvent(event)" class="action-btn view" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="editEvent(event)" class="action-btn edit" title="Edit Event">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="toggleEventStatus(event)" class="action-btn" :class="getStatusActionClass(event)" :title="getStatusActionTitle(event)">
                  <i class="fas" :class="getStatusActionIcon(event)"></i>
                </button>
              </div>
            </div>

            <div class="event-meta">
              <div class="meta-item">
                <i class="fas fa-clock"></i>
                <span>{{ formatEventDate(event.start_time) }}</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ event.location || 'Online' }}</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-users"></i>
                <span>{{ event.attendee_count || 0 }} attendees</span>
              </div>
            </div>

            <p class="event-description">{{ truncateText(event.description, 100) }}</p>

            <div class="event-footer">
              <span v-if="event.category" class="category-tag">{{ getCategoryName(event.category_id) }}</span>
              <span class="event-date">Created {{ formatDate(event.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <div class="pagination-info">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredEvents.length) }} of {{ filteredEvents.length }} events
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
const categoryFilter = ref('')
const sortBy = ref('created_at')
const currentPage = ref(1)
const itemsPerPage = ref(12)
const showCreateEventModal = ref(false)
const showCategoryModal = ref(false)

// Data
const events = ref<any[]>([])
const categories = ref<any[]>([])

// Stats
const totalEvents = ref(0)
const publishedEvents = ref(0)
const upcomingEvents = ref(0)
const pendingEvents = ref(0)
const totalAttendees = ref(0)
const avgAttendeesPerEvent = ref(0)
const nextEventDate = ref('')

onMounted(async () => {
  await Promise.all([
    loadEvents(),
    loadCategories(),
    loadStats()
  ])
})

const loadEvents = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_categories (
          name,
          color
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading events:', error)
    } else {
      events.value = data || []
    }
  } catch (error) {
    console.error('Error loading events:', error)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Error loading categories:', error)
    } else {
      categories.value = data || []
    }
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const loadStats = async () => {
  try {
    const now = new Date().toISOString()
    
    // Get total events count by status
    const { data: eventStats } = await supabase
      .from('events')
      .select('status, attendee_count, start_time')
    
    if (eventStats) {
      totalEvents.value = eventStats.length
      publishedEvents.value = eventStats.filter(e => e.status === 'published').length
      upcomingEvents.value = eventStats.filter(e => e.start_time > now).length
      pendingEvents.value = eventStats.filter(e => e.status === 'draft').length
      
      const attendeeCounts = eventStats.map(e => e.attendee_count || 0)
      totalAttendees.value = attendeeCounts.reduce((sum, count) => sum + count, 0)
      avgAttendeesPerEvent.value = totalEvents.value > 0 ? Math.round(totalAttendees.value / totalEvents.value) : 0
      
      // Find next upcoming event
      const upcomingEventsList = eventStats
        .filter(e => e.start_time > now && e.status === 'published')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      
      if (upcomingEventsList.length > 0) {
        nextEventDate.value = formatDate(upcomingEventsList[0].start_time)
      } else {
        nextEventDate.value = 'None scheduled'
      }
    }
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// Computed properties
const filteredEvents = computed(() => {
  let result = events.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(event => 
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      (event.location && event.location.toLowerCase().includes(query))
    )
  }

  if (statusFilter.value) {
    result = result.filter(event => event.status === statusFilter.value)
  }

  if (categoryFilter.value) {
    result = result.filter(event => event.category_id === categoryFilter.value)
  }

  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'start_time':
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      case 'attendee_count':
        return (b.attendee_count || 0) - (a.attendee_count || 0)
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredEvents.value.length / itemsPerPage.value))

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredEvents.value.slice(start, end)
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
  categoryFilter.value = ''
  sortBy.value = 'created_at'
  currentPage.value = 1
}

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : 'Uncategorized'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const formatEventDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getStatusActionClass = (event: any) => {
  switch (event.status) {
    case 'draft': return 'success'
    case 'published': return 'warning'
    case 'cancelled': return 'success'
    case 'hidden': return 'success'
    default: return 'secondary'
  }
}

const getStatusActionIcon = (event: any) => {
  switch (event.status) {
    case 'draft': return 'fa-check'
    case 'published': return 'fa-eye-slash'
    case 'cancelled': return 'fa-undo'
    case 'hidden': return 'fa-eye'
    default: return 'fa-cog'
  }
}

const getStatusActionTitle = (event: any) => {
  switch (event.status) {
    case 'draft': return 'Publish Event'
    case 'published': return 'Hide Event'
    case 'cancelled': return 'Restore Event'
    case 'hidden': return 'Show Event'
    default: return 'Manage Status'
  }
}

const viewEvent = (event: any) => {
  console.log('View event:', event)
  // Navigate to event detail view
}

const editEvent = (event: any) => {
  console.log('Edit event:', event)
  // Open edit event modal
}

const toggleEventStatus = async (event: any) => {
  let newStatus = 'published'
  
  switch (event.status) {
    case 'draft':
      newStatus = 'published'
      break
    case 'published':
      newStatus = 'hidden'
      break
    case 'cancelled':
      newStatus = 'published'
      break
    case 'hidden':
      newStatus = 'published'
      break
  }
  
  try {
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', event.id)
    
    if (error) {
      console.error('Error updating event status:', error)
      alert('Failed to update event status')
      return
    }
    
    // Update local data
    const index = events.value.findIndex(e => e.id === event.id)
    if (index !== -1) {
      events.value[index].status = newStatus
    }
    
    // Reload stats
    await loadStats()
    
  } catch (error) {
    console.error('Error updating event status:', error)
    alert('Failed to update event status')
  }
}

const exportEvents = () => {
  console.log('Export events')
  // Implement export functionality
}
</script>

<style scoped>
.events-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.header-left p {
  margin: 0;
  color: #7f8c8d;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn.primary {
  background: #3498db;
  color: white;
}

.btn.primary:hover {
  background: #2980b9;
}

.btn.secondary {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.btn.secondary:hover {
  background: #e9ecef;
}

.btn.success {
  background: #27ae60;
  color: white;
}

.btn.success:hover {
  background: #219a52;
}

.btn.warning {
  background: #f39c12;
  color: white;
}

.btn.warning:hover {
  background: #e67e22;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-card.total .stat-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-card.published .stat-icon { background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); }
.stat-card.upcoming .stat-icon { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); }
.stat-card.attendees .stat-icon { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); }

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-info h3 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
}

.stat-info p {
  margin: 0.25rem 0;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-change {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.stat-change.positive {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.filters-section {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-bar i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
}

.search-bar input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
}

.search-bar input:focus {
  outline: none;
  border-color: #3498db;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.filters select {
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 0.9rem;
  min-width: 150px;
  flex: 1;
}

.clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  color: #6c757d;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.clear-filters-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading-state i {
  font-size: 2rem;
  color: #3498db;
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 3rem;
  color: #bdc3c7;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.empty-state p {
  color: #7f8c8d;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.event-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.event-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  font-size: 3rem;
}

.event-badges {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background: white;
  backdrop-filter: blur(10px);
}

.status-badge.draft {
  color: #f39c12;
  background: rgba(243, 156, 18, 0.1);
}

.status-badge.published {
  color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
}

.status-badge.cancelled {
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.status-badge.hidden {
  color: #95a5a6;
  background: rgba(149, 165, 166, 0.1);
}

.recurring-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  background: rgba(142, 68, 173, 0.1);
  color: #8e44ad;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.event-content {
  padding: 1.5rem;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.event-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  margin-right: 1rem;
}

.event-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.view {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

.action-btn.view:hover {
  background: rgba(52, 152, 219, 0.2);
}

.action-btn.edit {
  background: rgba(241, 196, 15, 0.1);
  color: #f1c40f;
}

.action-btn.edit:hover {
  background: rgba(241, 196, 15, 0.2);
}

.action-btn.success {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.action-btn.success:hover {
  background: rgba(39, 174, 96, 0.2);
}

.action-btn.warning {
  background: rgba(243, 156, 18, 0.1);
  color: #f39c12;
}

.action-btn.warning:hover {
  background: rgba(243, 156, 18, 0.2);
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.meta-item i {
  width: 16px;
  color: #adb5bd;
}

.event-description {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.event-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f1f3f4;
}

.category-tag {
  padding: 0.25rem 0.75rem;
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.event-date {
  color: #adb5bd;
  font-size: 0.8rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn, .page-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #495057;
}

.pagination-btn:hover:not(:disabled), .page-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.active {
  background: #3498db;
  border-color: #3498db;
  color: white;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .events-view {
    gap: 1.5rem;
  }
  
  .header-section {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .header-left h2 {
    font-size: 1.25rem;
  }
  
  .header-left p {
    font-size: 0.9rem;
  }
  
  .header-actions {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .header-actions .btn {
    flex: 1;
    min-width: 120px;
    justify-content: center;
  }
  
  .btn-text {
    display: none;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
  
  .stat-info h3 {
    font-size: 1.5rem;
  }
  
  .stat-info p {
    font-size: 0.85rem;
  }
  
  .filters-section {
    padding: 1rem;
  }
  
  .search-bar {
    max-width: none;
  }
  
  .filters {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filters select {
    min-width: auto;
    flex: none;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .event-image {
    height: 160px;
  }
  
  .event-content {
    padding: 1rem;
  }
  
  .event-title {
    font-size: 1rem;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    text-align: center;
  }
  
  .pagination-info {
    font-size: 0.85rem;
  }
  
  .pagination-controls {
    justify-content: center;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .events-view {
    gap: 1rem;
  }
  
  .header-section {
    padding: 1rem;
  }
  
  .header-left h2 {
    font-size: 1.1rem;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .header-actions .btn {
    width: 100%;
  }
  
  .btn-text {
    display: inline;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 1.25rem;
    gap: 1rem;
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .event-image {
    height: 140px;
  }
  
  .event-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .event-title {
    margin-right: 0;
  }
  
  .event-meta {
    gap: 0.75rem;
  }
  
  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .stat-card:hover,
  .event-card:hover,
  .action-btn:hover,
  .page-btn:hover,
  .pagination-btn:hover {
    transform: none;
    background: inherit;
    box-shadow: inherit;
  }
  
  .stat-card:active {
    transform: scale(0.98);
  }
  
  .event-card:active {
    transform: scale(0.98);
  }
  
  .action-btn:active {
    transform: scale(0.95);
  }
  
  .page-btn:active,
  .pagination-btn:active {
    background: #f8f9fa;
  }
  
  .btn:active {
    transform: scale(0.98);
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .header-section,
  .stat-card,
  .filters-section,
  .event-card,
  .pagination {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
</style> 