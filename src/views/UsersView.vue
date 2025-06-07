<template>
  <div class="users-view">
    <!-- Header with Actions -->
    <div class="header-section">
      <div class="header-left">
        <h2>User Management</h2>
        <p>Manage community users and their permissions</p>
      </div>
      <div class="header-actions">
        <button @click="toggleViewMode" class="btn secondary view-toggle" :title="viewMode === 'table' ? 'Switch to Card View' : 'Switch to Table View'">
          <i class="fas" :class="viewMode === 'table' ? 'fa-th-large' : 'fa-table'"></i>
          <span class="view-label">{{ viewMode === 'table' ? 'Cards' : 'Table' }}</span>
        </button>
        <button @click="exportUsers" class="btn secondary">
          <i class="fas fa-download"></i>
          <span class="btn-text">Export</span>
        </button>
        <button @click="showAddUserModal = true" class="btn primary">
          <i class="fas fa-plus"></i>
          <span class="btn-text">Add User</span>
        </button>
      </div>
    </div>

    <!-- Mobile Filters Toggle -->
    <div class="mobile-filters-toggle">
      <button @click="showMobileFilters = !showMobileFilters" class="mobile-filter-btn">
        <i class="fas fa-filter"></i>
        <span>Filters</span>
        <i class="fas" :class="showMobileFilters ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
      </button>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section" :class="{ 'mobile-open': showMobileFilters }">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search users by name or email..."
          @input="handleSearch"
        >
      </div>
      
      <div class="filters">
        <select v-model="statusFilter" @change="applyFilters">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
        
        <select v-model="roleFilter" @change="applyFilters">
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="community_admin">Community Admin</option>
          <option value="moderator">Moderator</option>
          <option value="member">Member</option>
        </select>
        
        <select v-model="sortBy" @change="applyFilters">
          <option value="created_at">Newest First</option>
          <option value="name">Name A-Z</option>
          <option value="email">Email A-Z</option>
          <option value="last_login">Last Login</option>
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
      <p>Loading users from database...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="users.length === 0" class="empty-state">
      <i class="fas fa-users"></i>
      <h3>No Users Found</h3>
      <p>No users have been registered in the database yet.</p>
    </div>

    <!-- Users Content -->
    <div v-else class="users-content">
      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="table-section">
        <div class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
                </th>
                <th class="user-col">User</th>
                <th class="email-col">Email</th>
                <th class="status-col">Status</th>
                <th class="role-col">Role</th>
                <th class="communities-col">Communities</th>
                <th class="date-col">Joined</th>
                <th class="date-col">Last Login</th>
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user.id" class="user-row">
                <td class="checkbox-col">
                  <input type="checkbox" v-model="selectedUsers" :value="user.id">
                </td>
                
                <td class="user-col">
                  <div class="user-info">
                    <img :src="user.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'" :alt="user.name" class="user-avatar">
                    <div>
                      <div class="user-name">{{ user.name }}</div>
                      <div class="user-id">ID: {{ user.id.slice(0, 8) }}...</div>
                    </div>
                  </div>
                </td>
                
                <td class="email-col">
                  <div class="email">{{ user.email }}</div>
                </td>
                
                <td class="status-col">
                  <div class="status-dropdown" @click="toggleStatusDropdown(user.id)">
                    <span class="status-badge clickable" :class="(user.status || 'active').toLowerCase()">
                      {{ (user.status || 'active').toUpperCase() }}
                      <i class="fas fa-chevron-down status-arrow"></i>
                    </span>
                    <div v-if="statusDropdownOpen === user.id" class="dropdown-menu">
                      <button 
                        v-for="status in statusOptions" 
                        :key="status.value"
                        @click.stop="updateUserStatus(user, status.value)"
                        class="dropdown-item"
                        :class="{ active: (user.status || 'active') === status.value }"
                      >
                        <span class="status-indicator" :class="status.value"></span>
                        {{ status.label }}
                      </button>
                    </div>
                  </div>
                </td>
                
                <td class="role-col">
                  <div class="role-dropdown" @click="toggleRoleDropdown(user.id)">
                    <span class="role-badge clickable" :class="(user.role || 'member').toLowerCase()">
                      {{ (user.role || 'member').toUpperCase() }}
                      <i class="fas fa-chevron-down role-arrow"></i>
                    </span>
                    <div v-if="roleDropdownOpen === user.id" class="dropdown-menu">
                      <button 
                        v-for="role in roleOptions" 
                        :key="role.value"
                        @click.stop="updateUserRole(user, role.value)"
                        class="dropdown-item"
                        :class="{ active: (user.role || 'member') === role.value }"
                      >
                        <span class="role-indicator" :class="role.value"></span>
                        {{ role.label }}
                      </button>
                    </div>
                  </div>
                </td>
                
                <td class="communities-col">
                  <div class="communities-count">
                    {{ getUserCommunityCount(user) }} communities
                  </div>
                </td>
                
                <td class="date-col">
                  <div class="date">{{ formatDate(user.created_at) }}</div>
                </td>
                
                <td class="date-col">
                  <div class="date">{{ getLastLogin(user) }}</div>
                </td>
                
                <td class="actions-col">
                  <div class="actions">
                    <button @click="viewUser(user)" class="action-btn view" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button @click="editUser(user)" class="action-btn edit" title="Edit User">
                      <i class="fas fa-edit"></i>
                    </button>
                                    <button @click="banUser(user)" class="action-btn danger" :title="(user.status || 'active') === 'banned' ? 'Unban User' : 'Ban User'">
                  <i class="fas" :class="(user.status || 'active') === 'banned' ? 'fa-unlock' : 'fa-ban'"></i>
                </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Card View -->
      <div v-else class="cards-section">
        <div class="users-grid">
          <div v-for="user in paginatedUsers" :key="user.id" class="user-card">
            <div class="card-header">
              <input type="checkbox" v-model="selectedUsers" :value="user.id" class="card-checkbox">
              <div class="card-actions">
                <button @click="viewUser(user)" class="action-btn view" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="editUser(user)" class="action-btn edit" title="Edit User">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="banUser(user)" class="action-btn danger" :title="(user.status || 'active') === 'banned' ? 'Unban User' : 'Ban User'">
                  <i class="fas" :class="(user.status || 'active') === 'banned' ? 'fa-unlock' : 'fa-ban'"></i>
                </button>
              </div>
            </div>

            <div class="card-content">
              <div class="user-info">
                <img :src="user.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'" :alt="user.name" class="user-avatar">
                <div class="user-details">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-email">{{ user.email }}</div>
                  <div class="user-id">ID: {{ user.id.slice(0, 8) }}...</div>
                </div>
              </div>

              <div class="card-badges">
                <div class="status-dropdown" @click="toggleStatusDropdown(user.id)">
                  <span class="status-badge clickable" :class="(user.status || 'active').toLowerCase()">
                    {{ (user.status || 'active').toUpperCase() }}
                    <i class="fas fa-chevron-down status-arrow"></i>
                  </span>
                  <div v-if="statusDropdownOpen === user.id" class="dropdown-menu">
                    <button 
                      v-for="status in statusOptions" 
                      :key="status.value"
                      @click.stop="updateUserStatus(user, status.value)"
                      class="dropdown-item"
                      :class="{ active: (user.status || 'active') === status.value }"
                    >
                      <span class="status-indicator" :class="status.value"></span>
                      {{ status.label }}
                    </button>
                  </div>
                </div>
                
                <div class="role-dropdown" @click="toggleRoleDropdown(user.id)">
                  <span class="role-badge clickable" :class="(user.role || 'member').toLowerCase()">
                    {{ (user.role || 'member').toUpperCase() }}
                    <i class="fas fa-chevron-down role-arrow"></i>
                  </span>
                  <div v-if="roleDropdownOpen === user.id" class="dropdown-menu">
                    <button 
                      v-for="role in roleOptions" 
                      :key="role.value"
                      @click.stop="updateUserRole(user, role.value)"
                      class="dropdown-item"
                      :class="{ active: (user.role || 'member') === role.value }"
                    >
                      <span class="role-indicator" :class="role.value"></span>
                      {{ role.label }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="card-stats">
                <div class="stat">
                  <i class="fas fa-layer-group"></i>
                  <span>{{ getUserCommunityCount(user) }} communities</span>
                </div>
                <div class="stat">
                  <i class="fas fa-calendar"></i>
                  <span>Joined {{ formatDate(user.created_at) }}</span>
                </div>
                <div class="stat">
                  <i class="fas fa-clock"></i>
                  <span>Last login {{ getLastLogin(user) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedUsers.length > 0" class="bulk-actions">
        <div class="bulk-info">
          {{ selectedUsers.length }} user{{ selectedUsers.length > 1 ? 's' : '' }} selected
        </div>
        <div class="bulk-buttons">
          <button @click="bulkAction('ban')" class="btn danger">
            <i class="fas fa-ban"></i>
            <span class="btn-text">Ban</span>
          </button>
          <button @click="bulkAction('activate')" class="btn success">
            <i class="fas fa-check"></i>
            <span class="btn-text">Activate</span>
          </button>
          <button @click="bulkAction('export')" class="btn secondary">
            <i class="fas fa-download"></i>
            <span class="btn-text">Export</span>
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <div class="pagination-info">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }} of {{ filteredUsers.length }} users
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

    <!-- Add User Modal -->
    <div v-if="showAddUserModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Add New User</h3>
          <button @click="closeModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="createUser" class="user-form">
          <div class="form-group">
            <label for="name">Full Name *</label>
            <input 
              id="name"
              v-model="newUser.name" 
              type="text" 
              required
              placeholder="Enter full name"
            >
          </div>
          
          <div class="form-group">
            <label for="email">Email Address *</label>
            <input 
              id="email"
              v-model="newUser.email" 
              type="email" 
              required
              placeholder="Enter email address"
            >
          </div>
          
          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea 
              id="bio"
              v-model="newUser.bio" 
              placeholder="Enter user bio (optional)"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Profile Photo</label>
            <div class="photo-upload-section">
              <!-- Photo Preview -->
              <div class="photo-preview">
                <img 
                  v-if="photoPreview || newUser.avatar" 
                  :src="photoPreview || newUser.avatar" 
                  alt="Profile preview"
                  class="preview-image"
                >
                <div v-else class="photo-placeholder">
                  <i class="fas fa-user"></i>
                  <span>No photo selected</span>
                </div>
              </div>
              
              <!-- Photo Upload Controls -->
              <div class="photo-controls">
                <input 
                  ref="fileInput"
                  type="file" 
                  accept="image/*"
                  @change="handleFileSelect"
                  class="file-input"
                  hidden
                >
                <button 
                  type="button" 
                  @click="$refs.fileInput.click()"
                  class="btn secondary file-btn"
                  :disabled="uploading"
                >
                  <i v-if="uploading" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-camera"></i>
                  {{ uploading ? 'Uploading...' : 'Choose Photo' }}
                </button>
                
                <button 
                  v-if="photoPreview || newUser.avatar"
                  type="button" 
                  @click="removePhoto"
                  class="btn danger-outline"
                  :disabled="uploading"
                >
                  <i class="fas fa-trash"></i>
                  Remove
                </button>
              </div>
              
              <!-- Or manual URL input -->
              <div class="url-input-section">
                <label for="avatar">Or enter image URL manually:</label>
                <input 
                  id="avatar"
                  v-model="newUser.avatar" 
                  type="url" 
                  placeholder="https://example.com/image.jpg"
                  @input="handleUrlInput"
                >
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn secondary">
              Cancel
            </button>
            <button type="submit" :disabled="creating" class="btn primary">
              <i v-if="creating" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-plus"></i>
              {{ creating ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Community Selection Modal -->
    <div v-if="showCommunitySelectionModal" class="modal-overlay" @click="closeCommunitySelectionModal">
      <div class="modal-content community-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-users-cog"></i>
            Assign Community Admin
          </h3>
          <button @click="closeCommunitySelectionModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="admin-info">
            <div class="user-preview">
              <img :src="selectedUserForCommunityAdmin?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'" 
                   :alt="selectedUserForCommunityAdmin?.name" 
                   class="user-avatar">
              <div>
                <h4>{{ selectedUserForCommunityAdmin?.name }}</h4>
                <p>{{ selectedUserForCommunityAdmin?.email }}</p>
              </div>
            </div>
            
            <div class="role-explanation">
              <h5>🎯 Community Admin Privileges:</h5>
              <ul>
                <li>✅ Moderate messages in assigned communities</li>
                <li>✅ Manage community members</li>
                <li>✅ Create and manage events</li>
                <li>✅ Edit community settings</li>
                <li>❌ NO access to admin panel</li>
                <li>❌ Cannot manage other admins</li>
              </ul>
            </div>
          </div>
          
          <div class="community-selection">
            <h4>Select Communities to Admin:</h4>
            <p class="selection-note">Choose which communities this user will have admin privileges for.</p>
            
            <div v-if="loadingCommunities" class="loading-communities">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading communities...</span>
            </div>
            
            <div v-else-if="communities.length === 0" class="no-communities">
              <i class="fas fa-exclamation-triangle"></i>
              <p>No communities found. Create some communities first.</p>
            </div>
            
            <div v-else class="communities-list">
              <div v-for="community in communities" :key="community.id" class="community-item">
                <label class="community-checkbox">
                  <input type="checkbox" v-model="selectedCommunities" :value="community.id">
                  <span class="checkmark"></span>
                  <div class="community-info">
                    <div class="community-name">{{ community.name }}</div>
                    <div class="community-details">
                      {{ community.member_count || 0 }} members
                      <span v-if="community.description"> • {{ community.description.substring(0, 60) }}{{ community.description.length > 60 ? '...' : '' }}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="selection-summary">
            <span v-if="selectedCommunities.length === 0" class="no-selection">
              No communities selected
            </span>
            <span v-else class="communities-selected">
              {{ selectedCommunities.length }} communit{{ selectedCommunities.length === 1 ? 'y' : 'ies' }} selected
            </span>
          </div>
          <div class="action-buttons">
            <button @click="closeCommunitySelectionModal" class="btn secondary">
              Cancel
            </button>
            <button @click="assignCommunityAdmin" 
                    :disabled="selectedCommunities.length === 0" 
                    class="btn primary">
              <i class="fas fa-check"></i>
              Assign Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, Community } from '@/types'

const searchQuery = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const sortBy = ref('created_at')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const selectAll = ref(false)
const selectedUsers = ref<string[]>([])
const showAddUserModal = ref(false)
const loading = ref(true)
const creating = ref(false)
const uploading = ref(false)
const viewMode = ref('table')
const showMobileFilters = ref(false)

// Dropdown state
const statusDropdownOpen = ref<string | null>(null)
const roleDropdownOpen = ref<string | null>(null)
const showCommunitySelectionModal = ref(false)
const selectedUserForCommunityAdmin = ref<User | null>(null)
const selectedCommunities = ref<string[]>([])
const communities = ref<Community[]>([])
const loadingCommunities = ref(false)

// Status and role options
const statusOptions = ref([
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'banned', label: 'Banned' }
])

const roleOptions = ref([
  { value: 'member', label: 'Member' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'community_admin', label: 'Community Admin' },
  { value: 'super_admin', label: 'Super Admin' }
])

// Real users data from Supabase
const users = ref<User[]>([])

// Photo upload state
const photoPreview = ref('')
const selectedFile = ref<File | null>(null)

// New user form data
const newUser = ref({
  name: '',
  email: '',
  bio: '',
  avatar: ''
})

onMounted(async () => {
  await loadUsers()
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.status-dropdown') && !target.closest('.role-dropdown')) {
      statusDropdownOpen.value = null
      roleDropdownOpen.value = null
    }
  })
})

const loadCommunities = async () => {
  loadingCommunities.value = true
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, description, member_count')
      .order('name', { ascending: true })
    
    if (error) {
      console.error('Error loading communities:', error)
    } else {
      communities.value = data || []
    }
  } catch (error) {
    console.error('Error loading communities:', error)
  } finally {
    loadingCommunities.value = false
  }
}

const assignCommunityAdmin = async () => {
  if (!selectedUserForCommunityAdmin.value || selectedCommunities.value.length === 0) {
    alert('Please select at least one community')
    return
  }

  try {
    // First update the user's role to community_admin
    const { error: roleError } = await supabase
      .from('users')
      .update({ role: 'community_admin' })
      .eq('id', selectedUserForCommunityAdmin.value.id)
    
    if (roleError) {
      console.error('Error updating user role:', roleError)
      alert('Failed to update user role')
      return
    }

    // Then add community moderator entries for each selected community
    const moderatorEntries = selectedCommunities.value.map(communityId => ({
      community_id: communityId,
      user_id: selectedUserForCommunityAdmin.value!.id,
      permissions: {
        can_moderate_messages: true,
        can_manage_members: true,
        can_manage_events: true,
        can_edit_community: true
      }
    }))

    const { error: moderatorError } = await supabase
      .from('community_moderators')
      .upsert(moderatorEntries)
    
    if (moderatorError) {
      console.error('Error assigning community moderator:', moderatorError)
      alert('Role updated but failed to assign community admin privileges')
      return
    }

    // Update local data
    const userIndex = users.value.findIndex(u => u.id === selectedUserForCommunityAdmin.value!.id)
    if (userIndex !== -1) {
      users.value[userIndex].role = 'community_admin'
    }

    const communityNames = communities.value
      .filter(c => selectedCommunities.value.includes(c.id))
      .map(c => c.name)
      .join(', ')

    alert(`✅ ${selectedUserForCommunityAdmin.value.name} is now a Community Admin for:\n${communityNames}`)
    
    closeCommunitySelectionModal()
  } catch (error) {
    console.error('Error assigning community admin:', error)
    alert('Failed to assign community admin role')
  }
}

const closeCommunitySelectionModal = () => {
  showCommunitySelectionModal.value = false
  selectedUserForCommunityAdmin.value = null
  selectedCommunities.value = []
}

const loadUsers = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading users:', error)
    } else {
      users.value = data || []
    }
  } catch (error) {
    console.error('Error loading users:', error)
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  let result = users.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (statusFilter.value) {
    result = result.filter(user => (user.status || 'active') === statusFilter.value)
  }

  // Apply role filter
  if (roleFilter.value) {
    result = result.filter(user => (user.role || 'member') === roleFilter.value)
  }

  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'email':
        return a.email.localeCompare(b.email)
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage.value))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredUsers.value.slice(start, end)
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

const handleSearch = () => {
  currentPage.value = 1
}

const applyFilters = () => {
  currentPage.value = 1
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedUsers.value = paginatedUsers.value.map(user => user.id)
  } else {
    selectedUsers.value = []
  }
}

// Dropdown toggle functions
const toggleStatusDropdown = (userId: string) => {
  statusDropdownOpen.value = statusDropdownOpen.value === userId ? null : userId
  roleDropdownOpen.value = null // Close role dropdown
}

const toggleRoleDropdown = (userId: string) => {
  roleDropdownOpen.value = roleDropdownOpen.value === userId ? null : userId
  statusDropdownOpen.value = null // Close status dropdown
}

// Update user status
const updateUserStatus = async (user: User, newStatus: string) => {
  try {
    // Update in database
    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', user.id)
    
    if (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status')
      return
    }
    
    // Update local data
    const userIndex = users.value.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      users.value[userIndex].status = newStatus
    }
    
    statusDropdownOpen.value = null
    console.log(`Updated user ${user.name} status to ${newStatus}`)
  } catch (error) {
    console.error('Error updating user status:', error)
    alert('Failed to update user status')
  }
}

// Update user role
const updateUserRole = async (user: User, newRole: string) => {
  // If assigning community_admin role, show community selection modal
  if (newRole === 'community_admin') {
    selectedUserForCommunityAdmin.value = user
    await loadCommunities()
    showCommunitySelectionModal.value = true
    roleDropdownOpen.value = null
    return
  }

  // For super_admin, show confirmation dialog
  if (newRole === 'super_admin') {
    const confirmed = confirm(
      `⚠️ WARNING: You are about to grant SUPER ADMIN access to ${user.name}.\n\n` +
      `Super Admins have FULL ACCESS to the admin panel and can:\n` +
      `• Manage all users and communities\n` +
      `• Access all analytics and settings\n` +
      `• Grant/revoke admin privileges\n\n` +
      `Are you absolutely sure you want to proceed?`
    )
    
    if (!confirmed) {
      roleDropdownOpen.value = null
      return
    }
  }

  try {
    // Update in database
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', user.id)
    
    if (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role')
      return
    }
    
    // Update local data
    const userIndex = users.value.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
      users.value[userIndex].role = newRole
    }
    
    roleDropdownOpen.value = null
    
    if (newRole === 'super_admin') {
      alert(`✅ ${user.name} has been granted Super Admin access.\nThey can now access the admin panel at localhost:5173`)
    } else {
      console.log(`Updated user ${user.name} role to ${newRole}`)
    }
  } catch (error) {
    console.error('Error updating user role:', error)
    alert('Failed to update user role')
  }
}

const getUserCommunityCount = (user: User) => {
  return Math.floor(Math.random() * 5) + 1
}

const getLastLogin = (user: User) => {
  const days = Math.floor(Math.random() * 30)
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatDate(date.toISOString())
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

const viewUser = (user: User) => {
  console.log('View user:', user)
  // Navigate to user detail view
}

const editUser = (user: User) => {
  console.log('Edit user:', user)
  // Open edit user modal
}

const banUser = async (user: User) => {
  const currentStatus = user.status || 'active'
  const newStatus = currentStatus === 'banned' ? 'active' : 'banned'
  const action = newStatus === 'banned' ? 'ban' : 'unban'
  
  if (confirm(`Are you sure you want to ${action} user ${user.name}?`)) {
    await updateUserStatus(user, newStatus)
  }
}

const bulkAction = (action: string) => {
  console.log(`Bulk ${action} for users:`, selectedUsers.value)
  // Implement bulk actions
}

const exportUsers = () => {
  console.log('Export users')
  // Implement export functionality
}

const closeModal = () => {
  showAddUserModal.value = false
  resetForm()
}

const resetForm = () => {
  newUser.value = {
    name: '',
    email: '',
    bio: '',
    avatar: ''
  }
  photoPreview.value = ''
  selectedFile.value = null
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB')
    return
  }
  
  selectedFile.value = file
  
  // Create preview URL
  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  
  // Clear manual URL input
  newUser.value.avatar = ''
}

const handleUrlInput = () => {
  // Clear file selection when URL is entered
  photoPreview.value = ''
  selectedFile.value = null
}

const removePhoto = () => {
  photoPreview.value = ''
  selectedFile.value = null
  newUser.value.avatar = ''
}

const uploadPhoto = async (): Promise<string | null> => {
  if (!selectedFile.value) return null
  
  uploading.value = true
  
  try {
    // Generate unique filename
    const fileExt = selectedFile.value.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = fileName
    
    console.log('Uploading file:', filePath, 'Size:', selectedFile.value.size)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, selectedFile.value, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Upload error details:', error)
      alert(`Upload Error: ${error.message}`)
      return null
    }
    
    console.log('Upload successful:', data)
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    console.log('Public URL:', publicUrl)
    return publicUrl
    
  } catch (error) {
    console.error('Unexpected error during upload:', error)
    alert(`Unexpected Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    return null
  } finally {
    uploading.value = false
  }
}

const createUser = async () => {
  creating.value = true
  
  try {
    // Validate required fields
    if (!newUser.value.name.trim() || !newUser.value.email.trim()) {
      alert('Name and email are required')
      return
    }

    // Handle photo upload if file is selected
    let avatarUrl = newUser.value.avatar.trim() || null
    
    if (selectedFile.value && !avatarUrl) {
      // If file selected but no manual URL, try upload
      avatarUrl = await uploadPhoto()
      if (!avatarUrl) {
        // Upload failed, continue with manual URL or null
        console.log('Upload failed, continuing without photo')
      }
    }

    // Generate a temporary password
    const tempPassword = 'TempPass123!' + Math.random().toString(36).substring(2)
    
    // Create the auth user using regular signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUser.value.email.trim(),
      password: tempPassword,
      options: {
        data: {
          full_name: newUser.value.name.trim()
        }
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      alert('Error creating user account: ' + authError.message)
      return
    }

    if (authData.user) {
      // Wait a moment for any database triggers to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if user profile already exists (created by trigger)
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      
      let finalUserData = existingUser

      if (existingUser) {
        // User already exists, update it with our data
        const { data: updatedData, error: updateError } = await supabase
          .from('users')
          .update({
            name: newUser.value.name.trim(),
            bio: newUser.value.bio.trim() || null,
            avatar: avatarUrl,
            role: 'member',
            updated_at: new Date().toISOString()
          })
          .eq('id', authData.user.id)
          .select()
        
        if (updateError) {
          console.error('Error updating user profile:', updateError)
        } else if (updatedData && updatedData.length > 0) {
          finalUserData = updatedData[0]
        }
      } else {
        // User doesn't exist, create it
        const userData = {
          id: authData.user.id,
          name: newUser.value.name.trim(),
          email: newUser.value.email.trim(),
          bio: newUser.value.bio.trim() || null,
          avatar: avatarUrl,
          role: 'member',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert([userData])
          .select()

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          alert('User account created but profile setup failed: ' + profileError.message)
          return
        }

        if (profileData && profileData.length > 0) {
          finalUserData = profileData[0]
        }
      }

      if (finalUserData) {
        // Add the new user to the local users array
        users.value.unshift(finalUserData)
        
        // Close modal and reset form
        closeModal()
        
        // Show success message
        alert(`User created successfully! 
        
The user has been created and should check their email for verification.
Email: ${newUser.value.email.trim()}
Temporary password: ${tempPassword}

Please inform them to:
1. Check their email for the verification link
2. Sign in with the temporary password
3. Change their password after first login`)
      }
    } else {
      alert('User creation failed - no user data returned')
    }

  } catch (error) {
    console.error('Error creating user:', error)
    alert('An unexpected error occurred while creating the user: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    creating.value = false
  }
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'table' ? 'cards' : 'table'
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  roleFilter.value = ''
  sortBy.value = 'created_at'
  currentPage.value = 1
}
</script>

<style scoped>
.users-view {
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

.btn.danger {
  background: #e74c3c;
  color: white;
}

.btn.danger:hover {
  background: #c0392b;
}

.view-toggle {
  position: relative;
}

.view-label {
  margin-left: 0.5rem;
}

.mobile-filters-toggle {
  display: none;
  margin-bottom: 1rem;
}

.mobile-filter-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  color: #495057;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-filter-btn:hover {
  background: #f8f9fa;
}

.mobile-filter-btn i:first-child {
  margin-right: 0.5rem;
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

.table-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f3f4;
}

.user-row:hover {
  background: #f8f9fa;
}

.user-cell {
  min-width: 200px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 500;
  color: #2c3e50;
}

.user-id {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.email {
  color: #495057;
  font-size: 0.9rem;
}

.status-badge, .role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.active {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.status-badge.inactive {
  background: rgba(149, 165, 166, 0.1);
  color: #95a5a6;
}

.status-badge.banned {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.role-badge.community_admin {
  background: rgba(230, 126, 34, 0.1);
  color: #e67e22;
}

.role-badge.super_admin {
  background: rgba(142, 68, 173, 0.1);
  color: #8e44ad;
}

.role-badge.moderator {
  background: rgba(241, 196, 15, 0.1);
  color: #f1c40f;
}

.role-badge.member {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
}

/* Dropdown Styles */
.status-dropdown,
.role-dropdown {
  position: relative;
  display: inline-block;
}

.status-badge.clickable,
.role-badge.clickable {
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  user-select: none;
}

.status-badge.clickable:hover,
.role-badge.clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.status-arrow,
.role-arrow {
  font-size: 0.7rem;
  transition: transform 0.2s ease;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
  min-width: 120px;
}

.dropdown-item {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.85rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item.active {
  background-color: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.status-indicator,
.role-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.active {
  background-color: #28a745;
}

.status-indicator.inactive {
  background-color: #6c757d;
}

.status-indicator.banned {
  background-color: #dc3545;
}

.role-indicator.member {
  background-color: #3498db;
}

.role-indicator.moderator {
  background-color: #f1c40f;
}

.role-indicator.community_admin {
  background-color: #e67e22;
}

.role-indicator.super_admin {
  background-color: #8e44ad;
}

.communities-count {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.date {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.actions {
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

.action-btn.danger {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.action-btn.danger:hover {
  background: rgba(231, 76, 60, 0.2);
}

.bulk-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.cards-section {
  margin-top: 2rem;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.card-checkbox {
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.card-content {
  padding: 1.5rem;
}

.user-card .user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-card .user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-card .user-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.user-email {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.user-card .user-id {
  font-size: 0.8rem;
  color: #adb5bd;
}

.card-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.card-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.stat i {
  width: 16px;
  color: #adb5bd;
}

.bulk-info {
  color: #495057;
  font-weight: 500;
}

.bulk-buttons {
  display: flex;
  gap: 1rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-top: 1px solid #dee2e6;
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

.loading-state {
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

.loading-state p {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin: 0;
}

.empty-state {
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

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .users-view {
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
  
  .view-label,
  .btn-text {
    display: none;
  }
  
  .mobile-filters-toggle {
    display: block;
  }
  
  .filters-section {
    display: none;
    padding: 1rem;
  }
  
  .filters-section.mobile-open {
    display: flex;
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
  
  .users-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .users-table {
    min-width: 800px;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
  }
  
  .user-name {
    font-size: 0.9rem;
  }
  
  .user-id {
    font-size: 0.75rem;
  }
  
  .email {
    font-size: 0.85rem;
  }
  
  .status-badge,
  .role-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
  }
  
  .communities-count,
  .date {
    font-size: 0.8rem;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .bulk-actions {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    text-align: center;
  }
  
  .bulk-buttons {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
  }
  
  .bulk-buttons .btn {
    flex: 1;
    min-width: 100px;
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
  
  .modal-content {
    margin: 1rem;
    max-width: none;
  }
  
  .user-form {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .users-view {
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
  
  .view-label,
  .btn-text {
    display: inline;
  }
  
  .users-grid {
    gap: 0.75rem;
  }
  
  .user-card {
    margin: 0 -0.5rem;
  }
  
  .card-content {
    padding: 1rem;
  }
  
  .user-card .user-avatar {
    width: 50px;
    height: 50px;
  }
  
  .user-card .user-name {
    font-size: 1rem;
  }
  
  .card-stats {
    gap: 0.5rem;
  }
  
  .stat {
    font-size: 0.85rem;
  }
  
  .bulk-buttons {
    flex-direction: column;
  }
  
  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .modal-content {
    margin: 0.5rem;
    border-radius: 8px;
  }
  
  .photo-controls {
    flex-direction: column;
    align-items: stretch;
  }
}

/* Landscape Mobile */
@media screen and (max-height: 600px) and (orientation: landscape) {
  .modal-content {
    max-height: 80vh;
    margin: 1rem;
  }
  
  .user-form {
    padding: 1rem;
  }
  
  .coming-soon,
  .loading-state,
  .empty-state {
    padding: 2rem 1rem;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .user-row:hover,
  .user-card:hover,
  .action-btn:hover,
  .page-btn:hover,
  .pagination-btn:hover {
    background: inherit;
    transform: none;
    box-shadow: inherit;
  }
  
  .user-row:active {
    background: #f8f9fa;
  }
  
  .user-card:active {
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

/* Community Selection Modal */
.community-modal {
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.admin-info {
  margin-bottom: 2rem;
}

.user-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.user-preview h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.user-preview p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.role-explanation {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 1rem;
}

.role-explanation h5 {
  margin: 0 0 0.75rem 0;
  color: #856404;
}

.role-explanation ul {
  margin: 0;
  padding-left: 1.5rem;
}

.role-explanation li {
  margin-bottom: 0.5rem;
  color: #856404;
}

.community-selection h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.selection-note {
  margin: 0 0 1rem 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.loading-communities,
.no-communities {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.loading-communities i {
  margin-right: 0.5rem;
}

.communities-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.community-item {
  border-bottom: 1px solid #f1f3f5;
}

.community-item:last-child {
  border-bottom: none;
}

.community-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.community-checkbox:hover {
  background-color: #f8f9fa;
}

.community-checkbox input[type="checkbox"] {
  display: none;
}

.community-checkbox .checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #dee2e6;
  border-radius: 4px;
  position: relative;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.community-checkbox input[type="checkbox"]:checked + .checkmark {
  background-color: #3498db;
  border-color: #3498db;
}

.community-checkbox input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.community-info {
  flex: 1;
}

.community-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.community-details {
  color: #6c757d;
  font-size: 0.85rem;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e2e8f0;
  background: #f8f9fa;
}

.selection-summary {
  font-size: 0.9rem;
}

.no-selection {
  color: #dc3545;
}

.communities-selected {
  color: #28a745;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .header-section,
  .filters-section,
  .table-section,
  .user-card,
  .modal-content {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
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
  max-width: 500px;
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

.user-form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.form-actions .btn {
  min-width: 120px;
}

/* Photo Upload Styles */
.photo-upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.photo-preview {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.preview-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.photo-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
  font-size: 0.85rem;
}

.photo-placeholder i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #bdc3c7;
}

.photo-controls {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.file-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn.danger-outline {
  background: white;
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.btn.danger-outline:hover {
  background: #e74c3c;
  color: white;
}

.url-input-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.url-input-section label {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .modal-content {
    margin: 1rem;
    max-width: none;
  }
  
  .user-form {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
}
</style> 