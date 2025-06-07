<template>
  <div class="communities-view">
    <!-- Header with Actions -->
    <div class="header-section">
      <div class="header-left">
        <h2>Community Management</h2>
        <p>Manage all communities across the platform</p>
      </div>
      <div class="header-actions">
        <button @click="showApplicationsModal = true" class="btn secondary">
          <i class="fas fa-clipboard-list"></i>
          <span class="btn-text">Applications ({{ pendingApplications }})</span>
        </button>
        <button @click="exportCommunities" class="btn secondary">
          <i class="fas fa-download"></i>
          <span class="btn-text">Export</span>
        </button>
        <button @click="showCreateCommunityModal = true" class="btn primary">
          <i class="fas fa-plus"></i>
          <span class="btn-text">Create Community</span>
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card total">
        <div class="stat-icon">
          <i class="fas fa-layer-group"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalCommunities }}</h3>
          <p>Total Communities</p>
          <span class="stat-change">{{ publicCommunities }} public</span>
        </div>
      </div>
      
      <div class="stat-card members">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalMembers }}</h3>
          <p>Total Members</p>
          <span class="stat-change positive">{{ avgMembersPerCommunity }} avg per community</span>
        </div>
      </div>
      
      <div class="stat-card growth">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>{{ growthRate }}%</h3>
          <p>Growth Rate</p>
          <span class="stat-change positive">+{{ newCommunitiesThisWeek }} this week</span>
        </div>
      </div>

      <div class="stat-card applications">
        <div class="stat-icon">
          <i class="fas fa-clipboard-check"></i>
        </div>
        <div class="stat-info">
          <h3>{{ pendingApplications }}</h3>
          <p>Pending Applications</p>
          <span class="stat-change">{{ approvedToday }} approved today</span>
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
          placeholder="Search communities by name or description..."
        >
      </div>
      
      <div class="filters">
        <select v-model="statusFilter" @change="applyFilters">
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending Approval</option>
          <option value="rejected">Rejected</option>
          <option value="hidden">Hidden</option>
        </select>
        
        <select v-model="typeFilter" @change="applyFilters">
          <option value="">All Types</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        
        <select v-model="sortBy" @change="applyFilters">
          <option value="created_at">Newest First</option>
          <option value="name">Name A-Z</option>
          <option value="member_count">Most Members</option>
          <option value="activity">Most Active</option>
        </select>

        <button @click="clearFilters" class="clear-filters-btn">
          <i class="fas fa-times"></i>
          <span>Clear</span>
        </button>
      </div>
    </div>

    <!-- Communities Content -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading communities...</p>
    </div>

    <div v-else-if="communities.length === 0" class="empty-state">
      <i class="fas fa-layer-group"></i>
      <h3>No Communities Found</h3>
      <p>No communities have been created yet.</p>
    </div>

    <div v-else class="communities-content">
      <!-- Communities Grid -->
      <div class="communities-grid">
        <div v-for="community in paginatedCommunities" :key="community.id" class="community-card">
          <div class="community-image">
            <img v-if="community.cover_image" :src="community.cover_image" :alt="community.name">
            <div v-else class="image-placeholder">
              <i class="fas fa-layer-group"></i>
            </div>
            
            <div class="community-badges">
              <span class="status-badge" :class="community.status">{{ community.status }}</span>
              <span class="type-badge" :class="community.is_public ? 'public' : 'private'">
                <i class="fas" :class="community.is_public ? 'fa-globe' : 'fa-lock'"></i>
                {{ community.is_public ? 'Public' : 'Private' }}
              </span>
            </div>
          </div>

          <div class="community-content">
            <div class="community-header">
              <h3 class="community-name">{{ community.name }}</h3>
              <div class="community-actions">
                <button @click="viewCommunity(community)" class="action-btn view" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="editCommunity(community)" class="action-btn edit" title="Edit Community">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="manageModerators(community)" class="action-btn moderators" title="Manage Moderators">
                  <i class="fas fa-user-shield"></i>
                </button>
                <button @click="toggleCommunityStatus(community)" class="action-btn" :class="getStatusActionClass(community)" :title="getStatusActionTitle(community)">
                  <i class="fas" :class="getStatusActionIcon(community)"></i>
                </button>
              </div>
            </div>

            <p class="community-description">{{ truncateText(community.description, 100) }}</p>

            <div class="community-meta">
              <div class="meta-item">
                <i class="fas fa-users"></i>
                <span>{{ community.member_count || 0 }} members</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>{{ formatDate(community.created_at) }}</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-globe" v-if="community.is_public"></i>
                <i class="fas fa-lock" v-else></i>
                <span>{{ community.is_public ? 'Public' : 'Private' }}</span>
              </div>
            </div>

            <div class="community-footer">
              <div class="community-stats">
                <span class="activity-indicator" :class="getActivityClass(community)">
                  <i class="fas fa-circle"></i>
                  {{ getActivityText(community) }}
                </span>
              </div>
              <span class="community-status" :class="community.status">
                {{ community.status || 'pending' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <div class="pagination-info">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredCommunities.length) }} of {{ filteredCommunities.length }} communities
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

    <!-- Applications Modal -->
    <div v-if="showApplicationsModal" class="modal-overlay" @click="closeApplicationsModal">
      <div class="modal-content applications-modal" @click.stop>
        <div class="modal-header">
          <h3>Community Applications</h3>
          <button @click="closeApplicationsModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="applications-content">
          <div v-if="loadingApplications" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading applications...</p>
          </div>
          
          <div v-else-if="applications.length === 0" class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <h3>No Pending Applications</h3>
            <p>All community applications have been processed.</p>
          </div>
          
          <div v-else class="applications-list">
            <div v-for="application in applications" :key="application.id" class="application-item">
              <div class="application-info">
                <h4>{{ application.communities?.name || 'Unknown Community' }}</h4>
                <p><strong>Applicant:</strong> {{ application.users?.name || 'Unknown User' }} 
                  <span v-if="application.users?.email">({{ application.users.email }})</span>
                </p>
                <p><strong>Reason:</strong> {{ application.reason || 'No reason provided' }}</p>
                <p><strong>Applied:</strong> {{ formatDate(application.created_at) }}</p>
              </div>
              
              <div class="application-actions">
                <button @click="approveApplication(application)" class="btn success">
                  <i class="fas fa-check"></i>
                  Approve
                </button>
                <button @click="rejectApplication(application)" class="btn danger">
                  <i class="fas fa-times"></i>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Community Modal -->
    <div v-if="showCreateCommunityModal" class="modal-overlay" @click="closeCreateCommunityModal">
      <div class="modal-content create-community-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingCommunity ? 'Edit Community' : 'Create New Community' }}</h3>
          <button @click="closeCreateCommunityModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="create-community-content">
          <form @submit.prevent="saveCommunity" class="community-form">
            <div class="form-section">
              <h4>Basic Information</h4>
              
              <div class="form-group">
                <label for="community-name">Community Name *</label>
                <input 
                  id="community-name"
                  v-model="communityForm.name" 
                  type="text" 
                  required
                  placeholder="Enter community name"
                  class="form-input"
                >
              </div>
              
              <div class="form-group">
                <label for="community-description">Description</label>
                <textarea 
                  id="community-description"
                  v-model="communityForm.description" 
                  placeholder="Describe the community purpose and guidelines"
                  rows="4"
                  class="form-textarea"
                ></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="communityForm.is_public">
                    <span class="checkmark"></span>
                    Public Community
                  </label>
                  <small>Public communities are visible to all users</small>
                </div>
                
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="communityForm.application_required">
                    <span class="checkmark"></span>
                    Require Application
                  </label>
                  <small>Users must apply to join this community</small>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Community Images</h4>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="community-avatar">Avatar URL</label>
                  <input 
                    id="community-avatar"
                    v-model="communityForm.avatar" 
                    type="url" 
                    placeholder="https://example.com/avatar.jpg"
                    class="form-input"
                  >
                </div>
                
                <div class="form-group">
                  <label for="community-cover">Cover Image URL</label>
                  <input 
                    id="community-cover"
                    v-model="communityForm.cover_image" 
                    type="url" 
                    placeholder="https://example.com/cover.jpg"
                    class="form-input"
                  >
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Location (Optional)</h4>
              
              <div class="form-group">
                <label for="community-address">Address</label>
                <input 
                  id="community-address"
                  v-model="communityForm.address" 
                  type="text" 
                  placeholder="City, State, Country"
                  class="form-input"
                >
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="community-latitude">Latitude</label>
                  <input 
                    id="community-latitude"
                    v-model.number="communityForm.latitude" 
                    type="number" 
                    step="0.000001"
                    placeholder="40.7128"
                    class="form-input"
                  >
                </div>
                
                <div class="form-group">
                  <label for="community-longitude">Longitude</label>
                  <input 
                    id="community-longitude"
                    v-model.number="communityForm.longitude" 
                    type="number" 
                    step="0.000001"
                    placeholder="-74.0060"
                    class="form-input"
                  >
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeCreateCommunityModal" class="btn secondary">
                Cancel
              </button>
              <button type="submit" :disabled="!communityForm.name || savingCommunity" class="btn primary">
                <i v-if="savingCommunity" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{ savingCommunity ? 'Saving...' : (editingCommunity ? 'Update Community' : 'Create Community') }}
              </button>
            </div>
          </form>
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
const loadingApplications = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const sortBy = ref('created_at')
const currentPage = ref(1)
const itemsPerPage = ref(12)
const showApplicationsModal = ref(false)
const showCreateCommunityModal = ref(false)
const editingCommunity = ref<any>(null)
const savingCommunity = ref(false)

// Community form data
const communityForm = ref({
  name: '',
  description: '',
  is_public: true,
  application_required: false,
  avatar: '',
  cover_image: '',
  address: '',
  latitude: null as number | null,
  longitude: null as number | null
})

// Data
const communities = ref<any[]>([])
const applications = ref<any[]>([])

// Stats
const totalCommunities = ref(0)
const publicCommunities = ref(0)
const totalMembers = ref(0)
const avgMembersPerCommunity = ref(0)
const growthRate = ref(0)
const newCommunitiesThisWeek = ref(0)
const pendingApplications = ref(0)
const approvedToday = ref(0)

onMounted(async () => {
  await Promise.all([
    loadCommunities(),
    loadStats(),
    loadApplications()
  ])
})

const loadCommunities = async () => {
  loading.value = true
  try {
    // Simple query without complex joins that might cause issues
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading communities:', error)
      communities.value = []
    } else {
      communities.value = data || []
      console.log('Communities loaded:', data?.length || 0)
    }
  } catch (error) {
    console.error('Error loading communities:', error)
    communities.value = []
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    // Reset all stats to zero first
    totalCommunities.value = 0
    publicCommunities.value = 0
    totalMembers.value = 0
    avgMembersPerCommunity.value = 0
    growthRate.value = 0
    newCommunitiesThisWeek.value = 0
    pendingApplications.value = 0
    approvedToday.value = 0

    // Get community stats
    const { data: communityStats, error: communityError } = await supabase
      .from('communities')
      .select('status, is_public, member_count, created_at')
    
    if (communityError) {
      console.error('Error loading community stats:', communityError)
    } else if (communityStats && communityStats.length > 0) {
      totalCommunities.value = communityStats.length
      publicCommunities.value = communityStats.filter(c => c.is_public === true).length
      
      const memberCounts = communityStats.map(c => c.member_count || 0)
      totalMembers.value = memberCounts.reduce((sum, count) => sum + count, 0)
      avgMembersPerCommunity.value = totalCommunities.value > 0 ? Math.round(totalMembers.value / totalCommunities.value) : 0
      
      // Calculate growth rate based on actual data
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      newCommunitiesThisWeek.value = communityStats.filter(c => 
        c.created_at && new Date(c.created_at) > oneWeekAgo
      ).length
      
      // Calculate growth rate as percentage
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const communitiesLastWeek = communityStats.filter(c => 
        c.created_at && new Date(c.created_at) > twoWeeksAgo && new Date(c.created_at) <= oneWeekAgo
      ).length
      
      if (communitiesLastWeek > 0) {
        growthRate.value = Math.round((newCommunitiesThisWeek.value / communitiesLastWeek) * 100)
      } else {
        growthRate.value = newCommunitiesThisWeek.value > 0 ? 100 : 0
      }
    }
    
    // Get application stats
    const { data: applicationStats, error: appError } = await supabase
      .from('community_applications')
      .select('status, created_at')
    
    if (appError) {
      console.error('Error loading application stats:', appError)
    } else if (applicationStats && applicationStats.length > 0) {
      pendingApplications.value = applicationStats.filter(a => a.status === 'pending').length
      
      const today = new Date().toDateString()
      approvedToday.value = applicationStats.filter(a => 
        a.status === 'approved' && a.created_at && new Date(a.created_at).toDateString() === today
      ).length
    }

    console.log('Stats loaded:', {
      communities: totalCommunities.value,
      members: totalMembers.value,
      applications: pendingApplications.value
    })
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

const loadApplications = async () => {
  loadingApplications.value = true
  try {
    // Load applications with user and community data
    const { data, error } = await supabase
      .from('community_applications')
      .select(`
        *,
        users:user_id(name, email),
        communities:community_id(name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading applications:', error)
      // Fallback to simple query if joins fail
      const { data: simpleData, error: simpleError } = await supabase
        .from('community_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (simpleError) {
        console.error('Error loading simple applications:', simpleError)
        applications.value = []
      } else {
        applications.value = simpleData || []
      }
    } else {
      applications.value = data || []
      console.log('Applications loaded:', data?.length || 0)
    }
  } catch (error) {
    console.error('Error loading applications:', error)
    applications.value = []
  } finally {
    loadingApplications.value = false
  }
}

// Computed properties
const filteredCommunities = computed(() => {
  let result = communities.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(community => 
      community.name.toLowerCase().includes(query) ||
      community.description.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    result = result.filter(community => community.status === statusFilter.value)
  }

  if (typeFilter.value) {
    const isPublic = typeFilter.value === 'public'
    result = result.filter(community => community.is_public === isPublic)
  }

  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'member_count':
        return (b.member_count || 0) - (a.member_count || 0)
      case 'activity':
        // Mock activity sorting
        return Math.random() - 0.5
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredCommunities.value.length / itemsPerPage.value))

const paginatedCommunities = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCommunities.value.slice(start, end)
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
  typeFilter.value = ''
  sortBy.value = 'created_at'
  currentPage.value = 1
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getActivityClass = (community: any) => {
  // Calculate activity based on actual data
  const memberCount = community.member_count || 0
  const daysSinceCreated = Math.floor((new Date().getTime() - new Date(community.created_at).getTime()) / (1000 * 60 * 60 * 24))
  
  if (memberCount === 0) return 'low'
  if (memberCount > 100 || (memberCount > 10 && daysSinceCreated < 30)) return 'high'
  if (memberCount > 20 || daysSinceCreated < 7) return 'medium'
  return 'low'
}

const getActivityText = (community: any) => {
  const activityClass = getActivityClass(community)
  switch (activityClass) {
    case 'high': return 'Very Active'
    case 'medium': return 'Moderately Active' 
    case 'low': return 'Low Activity'
    default: return 'Unknown'
  }
}

const getStatusActionClass = (community: any) => {
  switch (community.status) {
    case 'pending': return 'success'
    case 'approved': return 'warning'
    case 'rejected': return 'success'
    case 'hidden': return 'success'
    default: return 'secondary'
  }
}

const getStatusActionIcon = (community: any) => {
  switch (community.status) {
    case 'pending': return 'fa-check'
    case 'approved': return 'fa-eye-slash'
    case 'rejected': return 'fa-check'
    case 'hidden': return 'fa-eye'
    default: return 'fa-cog'
  }
}

const getStatusActionTitle = (community: any) => {
  switch (community.status) {
    case 'pending': return 'Approve Community'
    case 'approved': return 'Hide Community'
    case 'rejected': return 'Approve Community'
    case 'hidden': return 'Show Community'
    default: return 'Manage Status'
  }
}

const viewCommunity = (community: any) => {
  console.log('View community:', community)
  // Navigate to community detail view
}



const manageModerators = (community: any) => {
  console.log('Manage moderators for:', community)
  // Open moderators management modal
}

const toggleCommunityStatus = async (community: any) => {
  let newStatus = 'approved'
  
  switch (community.status) {
    case 'pending':
      newStatus = 'approved'
      break
    case 'approved':
      newStatus = 'hidden'
      break
    case 'rejected':
      newStatus = 'approved'
      break
    case 'hidden':
      newStatus = 'approved'
      break
  }
  
  try {
    const { error } = await supabase
      .from('communities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', community.id)
    
    if (error) {
      console.error('Error updating community status:', error)
      alert('Failed to update community status')
      return
    }
    
    // Update local data
    const index = communities.value.findIndex(c => c.id === community.id)
    if (index !== -1) {
      communities.value[index].status = newStatus
    }
    
    // Reload stats
    await loadStats()
    
  } catch (error) {
    console.error('Error updating community status:', error)
    alert('Failed to update community status')
  }
}

const approveApplication = async (application: any) => {
  try {
    const { error } = await supabase
      .from('community_applications')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', application.id)
    
    if (error) {
      console.error('Error approving application:', error)
      alert('Failed to approve application')
      return
    }
    
    // Remove from local applications
    applications.value = applications.value.filter(a => a.id !== application.id)
    
    // Update stats
    await loadStats()
    
  } catch (error) {
    console.error('Error approving application:', error)
    alert('Failed to approve application')
  }
}

const rejectApplication = async (application: any) => {
  try {
    const { error } = await supabase
      .from('community_applications')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', application.id)
    
    if (error) {
      console.error('Error rejecting application:', error)
      alert('Failed to reject application')
      return
    }
    
    // Remove from local applications
    applications.value = applications.value.filter(a => a.id !== application.id)
    
    // Update stats
    await loadStats()
    
  } catch (error) {
    console.error('Error rejecting application:', error)
    alert('Failed to reject application')
  }
}

const closeApplicationsModal = () => {
  showApplicationsModal.value = false
}

const exportCommunities = () => {
  console.log('Export communities')
  // Implement export functionality
}

// Community creation/editing functions
const resetCommunityForm = () => {
  communityForm.value = {
    name: '',
    description: '',
    is_public: true,
    application_required: false,
    avatar: '',
    cover_image: '',
    address: '',
    latitude: null,
    longitude: null
  }
}

const closeCreateCommunityModal = () => {
  showCreateCommunityModal.value = false
  editingCommunity.value = null
  resetCommunityForm()
}

const editCommunity = (community: any) => {
  editingCommunity.value = community
  communityForm.value = {
    name: community.name || '',
    description: community.description || '',
    is_public: community.is_public ?? true,
    application_required: community.application_required ?? false,
    avatar: community.avatar || '',
    cover_image: community.cover_image || '',
    address: community.location?.address || '',
    latitude: community.location?.latitude || null,
    longitude: community.location?.longitude || null
  }
  showCreateCommunityModal.value = true
}

const saveCommunity = async () => {
  if (!communityForm.value.name.trim()) return
  
  savingCommunity.value = true
  
  try {
    // Prepare location object
    const location = {
      address: communityForm.value.address || '',
      latitude: communityForm.value.latitude,
      longitude: communityForm.value.longitude
    }

    const communityData = {
      name: communityForm.value.name.trim(),
      description: communityForm.value.description.trim(),
      is_public: communityForm.value.is_public,
      application_required: communityForm.value.application_required,
      avatar: communityForm.value.avatar || null,
      cover_image: communityForm.value.cover_image || null,
      location: location,
      status: 'approved', // Auto-approve communities created by admin
      updated_at: new Date().toISOString()
    }

    if (editingCommunity.value) {
      // Update existing community
      const { error } = await supabase
        .from('communities')
        .update(communityData)
        .eq('id', editingCommunity.value.id)
      
      if (error) {
        console.error('Error updating community:', error)
        alert('Failed to update community')
        return
      }

      // Update local data
      const index = communities.value.findIndex(c => c.id === editingCommunity.value.id)
      if (index !== -1) {
        communities.value[index] = { ...communities.value[index], ...communityData }
      }
    } else {
      // Create new community
      const { data, error } = await supabase
        .from('communities')
        .insert([{
          ...communityData,
          created_at: new Date().toISOString()
        }])
        .select()
      
      if (error) {
        console.error('Error creating community:', error)
        alert('Failed to create community')
        return
      }

      if (data && data.length > 0) {
        communities.value.unshift(data[0])
      }
    }

    // Reload stats and close modal
    await loadStats()
    closeCreateCommunityModal()
    
  } catch (error) {
    console.error('Error saving community:', error)
    alert('Failed to save community')
  } finally {
    savingCommunity.value = false
  }
}
</script>

<style scoped>
.communities-view {
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

.btn.danger {
  background: #e74c3c;
  color: white;
}

.btn.danger:hover {
  background: #c0392b;
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
.stat-card.members .stat-icon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-card.growth .stat-icon { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-card.applications .stat-icon { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

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
  margin: 0;
  font-size: 1rem;
}

.communities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.community-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.community-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.community-image {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.community-image img {
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
  font-size: 2.5rem;
}

.community-badges {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-badge, .type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}

.status-badge.active {
  background: rgba(39, 174, 96, 0.9);
  color: white;
}

.status-badge.pending {
  background: rgba(243, 156, 18, 0.9);
  color: white;
}

.status-badge.suspended {
  background: rgba(231, 76, 60, 0.9);
  color: white;
}

.status-badge.archived {
  background: rgba(149, 165, 166, 0.9);
  color: white;
}

.type-badge.public {
  background: rgba(52, 152, 219, 0.9);
  color: white;
}

.type-badge.private {
  background: rgba(142, 68, 173, 0.9);
  color: white;
}

.community-content {
  padding: 1.5rem;
}

.community-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.community-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
  margin-right: 1rem;
}

.community-actions {
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

.action-btn.moderators {
  background: rgba(142, 68, 173, 0.1);
  color: #8e44ad;
}

.action-btn.moderators:hover {
  background: rgba(142, 68, 173, 0.2);
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

.community-description {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.community-meta {
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

.community-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f1f3f4;
}

.activity-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.activity-indicator.high {
  color: #27ae60;
}

.activity-indicator.medium {
  color: #f39c12;
}

.activity-indicator.low {
  color: #e74c3c;
}

.activity-indicator i {
  font-size: 0.6rem;
}

.community-date {
  color: #adb5bd;
  font-size: 0.8rem;
}

.community-status {
  color: #adb5bd;
  font-size: 0.8rem;
  text-transform: capitalize;
  font-weight: 500;
}

.community-status.approved {
  color: #27ae60;
}

.community-status.pending {
  color: #f39c12;
}

.community-status.rejected {
  color: #e74c3c;
}

.community-status.hidden {
  color: #95a5a6;
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #7f8c8d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #e74c3c;
}

.applications-content {
  padding: 2rem;
}

.applications-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.application-item {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.application-info h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.application-info p {
  margin: 0.5rem 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.application-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.application-actions .btn {
  min-width: 100px;
}

/* Community Creation Modal Styles */
.create-community-modal {
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
}

.create-community-content {
  padding: 0;
}

.community-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f3f4;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.checkbox-label small {
  display: block;
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  margin-left: 1.5rem;
}

.form-actions {
  padding: 1.5rem 2rem;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.btn.primary {
  background: #3498db;
  color: white;
  border: 1px solid #3498db;
}

.btn.primary:hover:not(:disabled) {
  background: #2980b9;
  border-color: #2980b9;
}

.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile responsive for modal */
@media screen and (max-width: 768px) {
  .create-community-modal {
    max-width: 95vw;
    margin: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-section {
    padding: 1rem 1.5rem;
  }
  
  .form-actions {
    padding: 1rem 1.5rem;
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .communities-view {
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
  
  .content {
    gap: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .stat-card {
    padding: 1.5rem;
    gap: 1rem;
  }
  
  .stat-card i {
    font-size: 2rem;
  }
  
  .stat-card h3 {
    font-size: 1.5rem;
  }
  
  .stat-card p {
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
  .communities-view {
    gap: 1rem;
  }
  
  .header {
    padding: 1rem;
  }
  
  .header h2 {
    font-size: 1.1rem;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 1.25rem;
    gap: 1rem;
  }
  
  .stat-card i {
    font-size: 2.5rem;
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

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .stat-card:hover {
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .stat-card:active {
    transform: scale(0.98);
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .stat-card,
  .coming-soon {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
</style> 