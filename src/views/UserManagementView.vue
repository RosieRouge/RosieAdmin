<template>
  <div class="user-management" :class="viewClasses">
    <!-- Compact Header with Stats -->
    <div class="header-section">
      <div class="header-top">
        <div class="title-area">
          <h1>User Management</h1>
          <div class="quick-stats">
            <span class="stat-item">
              <i class="fas fa-users"></i>
              {{ stats.total }} total
            </span>
            <span class="stat-item">
              <i class="fas fa-user-md"></i>
              {{ stats.counselors }} counselors
            </span>
            <span class="stat-item">
              <i class="fas fa-user-shield"></i>
              {{ stats.admins }} admins
            </span>
            <span class="stat-item active-users">
              <i class="fas fa-check-circle"></i>
              {{ stats.active }} active
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button @click="loadUsers" class="action-btn refresh" title="Refresh">
            <i class="fas fa-sync-alt"></i>
          </button>
          <button @click="exportUsers" class="action-btn export" title="Export">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn btn-primary" @click="showCreateUser = true">
            <i class="fas fa-plus"></i>
            <span>Add User</span>
          </button>
        </div>
      </div>

      <!-- Compact Filters -->
      <div class="filters-row">
        <div class="search-input">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search users..."
          />
        </div>
        
        <div class="filter-controls">
          <select v-model="roleFilter" @change="applyFilters">
            <option value="">All Roles</option>
            <option value="client">Client</option>
            <option value="counselor">Counselor</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          
          <select v-model="statusFilter" @change="applyFilters">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select v-model="sortBy" @change="applyFilters">
            <option value="created_at">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="email">Email A-Z</option>
            <option value="last_active">Last Active</option>
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
      <p>Loading users...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <i class="fas fa-users"></i>
      <h3>No Users Found</h3>
      <p>No users match your current filters or no users exist yet.</p>
      <button @click="showCreateUser = true" class="btn btn-primary">
        <i class="fas fa-plus"></i>
        Create First User
      </button>
    </div>

    <!-- Users Table -->
    <div v-else class="table-container">
      <!-- Bulk Actions -->
      <div v-if="selectedUsers.length > 0" class="bulk-actions">
        <div class="bulk-info">
          {{ selectedUsers.length }} user{{ selectedUsers.length > 1 ? 's' : '' }} selected
        </div>
        <div class="bulk-buttons">
          <button @click="bulkAction('activate')" class="btn btn-success">
            <i class="fas fa-check"></i>
            <span>Activate</span>
          </button>
          <button @click="bulkAction('deactivate')" class="btn btn-warning">
            <i class="fas fa-pause"></i>
            <span>Deactivate</span>
          </button>
          <button @click="bulkAction('export')" class="btn btn-secondary">
            <i class="fas fa-download"></i>
            <span>Export Selected</span>
          </button>
        </div>
      </div>

      <!-- Mobile User Cards -->
      <div class="mobile-user-list">
        <div v-for="user in paginatedUsers" :key="user.id" class="mobile-user-card">
          <div class="mobile-user-header">
            <input type="checkbox" v-model="selectedUsers" :value="user.id">
            <div class="mobile-user-profile">
              <div class="mobile-user-name">{{ getUserDisplayName(user) }}</div>
              <div class="user-avatar">
                <img v-if="user.avatar" :src="user.avatar" :alt="getUserDisplayName(user)" />
                <i v-else class="fas fa-user"></i>
              </div>
              <div class="mobile-user-email">{{ getUserDisplayEmail(user) }}</div>
            </div>
          </div>
          
          <div class="mobile-user-details">
            <div class="mobile-detail-item">
              <div class="mobile-detail-label">Roles</div>
              <div class="mobile-detail-value">
                <span v-if="!user.role" class="role-badge client">
                  Client
                </span>
                <span v-else class="role-badge" :class="user.role">
                  {{ formatRole(user.role) }}
                </span>
                <!-- Show additional roles -->
                <span v-if="user.roles && user.roles.length > 0" 
                      v-for="role in user.roles.filter(r => r !== user.role)" 
                      :key="role"
                      class="role-badge additional" 
                      :class="role">
                  {{ formatRole(role) }}
                </span>
              </div>
            </div>
            
            <div class="mobile-detail-item">
              <div class="mobile-detail-label">Status</div>
              <div class="mobile-detail-value">
                <span class="status-badge" :class="user.is_active ? 'active' : 'inactive'">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            
            <div class="mobile-detail-item">
              <div class="mobile-detail-label">Joined</div>
              <div class="mobile-detail-value">{{ user.created_at ? formatDate(user.created_at) : 'Unknown' }}</div>
            </div>
            
            <div class="mobile-detail-item">
              <div class="mobile-detail-label">Last Active</div>
              <div class="mobile-detail-value">{{ getLastActive(user) }}</div>
            </div>
          </div>
          
                      <div class="mobile-user-actions">
              <button @click="editUser(user)" class="mobile-action-btn edit">
                <i class="fas fa-edit"></i>
                <span>Edit</span>
              </button>
              <button @click="resetUserPassword(user)" class="mobile-action-btn reset">
                <i class="fas fa-key"></i>
                <span>Reset Password</span>
              </button>
              <button 
                v-if="!hasCounselorRole(user)" 
                @click="addCounselorRoleToUser(user)" 
                class="mobile-action-btn counselor"
              >
                <i class="fas fa-user-md"></i>
                <span>Add Counselor</span>
              </button>
              <button 
                v-else 
                @click="removeCounselorRoleFromUser(user)" 
                class="mobile-action-btn remove-counselor"
              >
                <i class="fas fa-user-times"></i>
                <span>Remove Counselor</span>
              </button>
              <button @click="toggleUserStatus(user)" class="mobile-action-btn toggle">
                <i class="fas" :class="user.is_active ? 'fa-pause' : 'fa-play'"></i>
                <span>{{ user.is_active ? 'Deactivate' : 'Activate' }}</span>
              </button>
              <button @click="deleteUser(user)" class="mobile-action-btn delete">
                <i class="fas fa-trash"></i>
                <span>Delete</span>
              </button>
            </div>
        </div>
      </div>

      <!-- Desktop now uses mobile card layout too -->
      <div class="desktop-user-list">
        <div v-for="user in paginatedUsers" :key="user.id" class="desktop-user-card">
          <div class="desktop-user-header">
            <input type="checkbox" v-model="selectedUsers" :value="user.id">
            <div class="desktop-user-profile">
              <div class="user-avatar">
                <img v-if="user.avatar" :src="user.avatar" :alt="getUserDisplayName(user)" />
                <i v-else class="fas fa-user"></i>
              </div>
              <div class="desktop-user-name">{{ getUserDisplayName(user) }}</div>
              <div class="desktop-user-email">{{ getUserDisplayEmail(user) }}</div>
            </div>
          </div>
          
          <div class="desktop-user-details">
            <div class="desktop-detail-item">
              <div class="desktop-detail-label">Roles</div>
              <div class="desktop-detail-value">
                <span v-if="!user.role" class="role-badge client">
                  Client
                </span>
                <span v-else class="role-badge" :class="user.role">
                  {{ formatRole(user.role) }}
                </span>
                <!-- Show additional roles -->
                <span v-if="user.roles && user.roles.length > 0" 
                      v-for="role in user.roles.filter(r => r !== user.role)" 
                      :key="role"
                      class="role-badge additional" 
                      :class="role">
                  {{ formatRole(role) }}
                </span>
              </div>
            </div>
            
            <div class="desktop-detail-item">
              <div class="desktop-detail-label">Status</div>
              <div class="desktop-detail-value">
                <span class="status-badge" :class="user.is_active ? 'active' : 'inactive'">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
            
            <div class="desktop-detail-item">
              <div class="desktop-detail-label">Joined</div>
              <div class="desktop-detail-value">{{ user.created_at ? formatDate(user.created_at) : 'Unknown' }}</div>
            </div>
            
            <div class="desktop-detail-item">
              <div class="desktop-detail-label">Last Active</div>
              <div class="desktop-detail-value">{{ getLastActive(user) }}</div>
            </div>
          </div>
          
          <div class="desktop-user-actions">
            <button @click="editUser(user)" class="desktop-action-btn edit">
              <i class="fas fa-edit"></i>
              <span>Edit</span>
            </button>
            <button @click="resetUserPassword(user)" class="desktop-action-btn reset">
              <i class="fas fa-key"></i>
              <span>Reset Password</span>
            </button>
            <button 
              v-if="!hasCounselorRole(user)" 
              @click="addCounselorRoleToUser(user)" 
              class="desktop-action-btn counselor"
            >
              <i class="fas fa-user-md"></i>
              <span>Add Counselor</span>
            </button>
            <button 
              v-else 
              @click="removeCounselorRoleFromUser(user)" 
              class="desktop-action-btn remove-counselor"
            >
              <i class="fas fa-user-times"></i>
              <span>Remove Counselor</span>
            </button>
            <button @click="toggleUserStatus(user)" class="desktop-action-btn toggle">
              <i class="fas" :class="user.is_active ? 'fa-pause' : 'fa-play'"></i>
              <span>{{ user.is_active ? 'Deactivate' : 'Activate' }}</span>
            </button>
            <button @click="deleteUser(user)" class="desktop-action-btn delete">
              <i class="fas fa-trash"></i>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Pagination -->
      <div class="pagination-section">
        <div class="pagination-info">
          <span class="results-count">
            Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }} of {{ filteredUsers.length }} users
          </span>
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
        </div>
        
        <div class="pagination-controls">
          <button 
            @click="goToFirstPage" 
            :disabled="currentPage === 1"
            class="pagination-btn first"
            title="First Page"
          >
            <i class="fas fa-angle-double-left"></i>
            <span>First</span>
          </button>
          
          <button 
            @click="goToPreviousPage" 
            :disabled="currentPage === 1"
            class="pagination-btn prev"
            title="Previous Page"
          >
            <i class="fas fa-chevron-left"></i>
            <span>Previous</span>
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              @click="goToPage(page)"
              :class="{ active: page === currentPage }"
              class="page-btn"
              :title="`Go to page ${page}`"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            @click="goToNextPage" 
            :disabled="currentPage === totalPages"
            class="pagination-btn next"
            title="Next Page"
          >
            <span>Next</span>
            <i class="fas fa-chevron-right"></i>
          </button>
          
          <button 
            @click="goToLastPage" 
            :disabled="currentPage === totalPages"
            class="pagination-btn last"
            title="Last Page"
          >
            <span>Last</span>
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
        
        <div class="page-size-selector">
          <label for="pageSize">Items per page:</label>
          <select id="pageSize" v-model="itemsPerPage" @change="handlePageSizeChange">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showCreateUser" class="modal-overlay" @click="closeCreateUser">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Create New User</h3>
          <button class="modal-close" @click="closeCreateUser">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createUser">
            <div class="form-group">
              <label>Full Name *</label>
              <input v-model="newUser.name" type="text" required placeholder="Enter full name" />
            </div>
            
            <div class="form-group">
              <label>Username</label>
              <input v-model="newUser.username" type="text" placeholder="Optional username" />
            </div>
            
            <div class="form-group">
              <label>Email Address *</label>
              <input v-model="newUser.email" type="email" required placeholder="Enter email address" />
            </div>
            
            <div class="form-group">
              <label>Password *</label>
              <input v-model="newUser.password" type="password" required minlength="6" placeholder="Minimum 6 characters" />
            </div>
            
            <div class="form-group">
              <label>Role *</label>
              <div class="radio-group">
                <label class="radio-label" v-for="role in roleOptions" :key="role.value" :class="{ disabled: !authStore.canAssignRole(role.value) }">
                  <input type="radio" v-model="newUser.role" :value="role.value" :disabled="!authStore.canAssignRole(role.value)" />
                  {{ role.label }}
                  <i v-if="!authStore.canAssignRole(role.value)" class="fas fa-lock" title="Insufficient permissions to assign this role"></i>
                </label>
              </div>
              <small>Select a role for this user</small>
            </div>
            
            <div class="form-group">
              <label>Phone (Optional)</label>
              <input v-model="newUser.phone" type="tel" placeholder="Phone number" />
            </div>
            
            <div class="form-group">
              <label>Bio (Optional)</label>
              <textarea v-model="newUser.bio" placeholder="Brief description or specialization" rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newUser.skip_email_verification">
                <span>Skip email verification (for team members)</span>
              </label>
              <small>Check this for internal team members who don't need email verification</small>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" @click="closeCreateUser">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-plus"></i>
                {{ loading ? 'Creating...' : 'Create User' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUser" class="modal-overlay" @click="closeEditUser">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Edit User</h3>
          <button class="modal-close" @click="closeEditUser">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateUser">
            <div class="form-group">
              <label>Full Name *</label>
              <input v-model="editingUser!.name" type="text" required />
            </div>
            
            <div class="form-group">
              <label>Username</label>
              <input v-model="editingUser!.username" type="text" placeholder="Optional username" />
            </div>
            
            <div class="form-group">
              <label>Email Address *</label>
              <input v-model="editingUser!.email" type="email" required />
            </div>
            
            <div class="form-group">
              <label>Role *</label>
              <div class="radio-group">
                <label class="radio-label" v-for="role in roleOptions" :key="role.value" :class="{ disabled: !canModifyRole(editingUser!, role.value) }">
                  <input type="radio" v-model="editingUser!.role" :value="role.value" :disabled="!canModifyRole(editingUser!, role.value)" />
                  {{ role.label }}
                  <i v-if="!canModifyRole(editingUser!, role.value)" class="fas fa-lock" title="Insufficient permissions to modify this role"></i>
                </label>
              </div>
              <small>Select a role for this user</small>
            </div>
            
            <div class="form-group">
              <label>Phone</label>
              <input v-model="editingUser!.phone" type="tel" />
            </div>
            
            <div class="form-group">
              <label>Bio</label>
              <textarea v-model="editingUser!.bio" rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="editingUser!.is_active">
                <span>User is active</span>
              </label>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="editingUser!.password_reset_required">
                <span>Require password reset on next login</span>
              </label>
              <small>Useful for users with anonymous emails who need new passwords</small>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" @click="closeEditUser">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{ loading ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Bottom spacer for better scrolling -->
    <div class="bottom-spacer"></div>

    <!-- Toast -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import type { User, UserRole } from '@/types'
import { useResponsiveLayout } from '@/composables/useResponsiveLayout'

const authStore = useAuthStore()

// Responsive layout
const { viewClasses, setupResponsiveLayout } = useResponsiveLayout()

const users = ref<User[]>([])
const loading = ref(false)
const roleFilter = ref('')
const statusFilter = ref('')
const sortBy = ref('created_at')
const searchQuery = ref('')
const showCreateUser = ref(false)
const showEditUser = ref(false)
const selectedUsers = ref<string[]>([])
const selectAll = ref(false)
const roleDropdownOpen = ref<string | null>(null)
const currentPage = ref(1)
const itemsPerPage = ref(20)

const newUser = ref({
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'client' as UserRole,
  phone: '',
  bio: '',
  skip_email_verification: false
})

const editingUser = ref<User | null>(null)

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const roleOptions = [
  { value: 'client' as UserRole, label: 'Client' },
  { value: 'counselor' as UserRole, label: 'Counselor' },
  { value: 'admin' as UserRole, label: 'Admin' },
  { value: 'super_admin' as UserRole, label: 'Super Admin' }
]

const stats = computed(() => ({
  total: users.value.length,
  counselors: users.value.filter(u => {
    // Count users who have counselor as primary role OR in their roles array
    return u.role === 'counselor' || (u.roles && u.roles.includes('counselor'))
  }).length,
  admins: users.value.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
  active: users.value.filter(u => u.is_active).length
}))

const filteredUsers = computed(() => {
  let filtered = users.value

  if (roleFilter.value) {
    filtered = filtered.filter(u => u.role === roleFilter.value)
  }

  if (statusFilter.value) {
    if (statusFilter.value === 'active') {
      filtered = filtered.filter(u => u.is_active)
    } else if (statusFilter.value === 'inactive') {
      filtered = filtered.filter(u => !u.is_active)
    }
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(u => 
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    )
  }

  // Sort
  if (sortBy.value === 'name') {
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  } else if (sortBy.value === 'email') {
    filtered.sort((a, b) => a.email.localeCompare(b.email))
  } else if (sortBy.value === 'created_at') {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage.value))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredUsers.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i)
  }
  
  return pages
})

// Pagination methods
const goToFirstPage = () => {
  currentPage.value = 1
}

const goToPreviousPage = () => {
  currentPage.value = Math.max(1, currentPage.value - 1)
}

const goToNextPage = () => {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
}

const goToLastPage = () => {
  currentPage.value = totalPages.value
}

const goToPage = (page: number) => {
  currentPage.value = page
}

const handlePageSizeChange = () => {
  currentPage.value = 1 // Reset to first page when changing page size
}

const loadUsers = async () => {
  loading.value = true
  try {
    console.log('Loading users from Supabase...')
    
    const { data, error, status, statusText } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Supabase response:', { data, error, status, statusText })

    if (error) {
      console.error('Error loading users:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      showToast(`Failed to load users: ${error.message}`, 'error')
      users.value = []
    } else {
      console.log('Users loaded successfully:', data)
      console.log('Number of users found:', data?.length || 0)
      users.value = data || []
      
      if (!data || data.length === 0) {
        console.log('No users found in database')
        showToast('No users found in database. You may need to create some users first.', 'success')
      } else {
        showToast(`Successfully loaded ${data.length} users!`, 'success')
      }
    }
  } catch (error: any) {
    console.error('Failed to load users:', error)
    console.error('Catch block error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    showToast(`Failed to load users: ${error.message}`, 'error')
    users.value = []
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password || !newUser.value.role) {
    showToast('Please fill in all required fields', 'error')
    return
  }

  loading.value = true
  
  try {
    console.log('Creating user with auth store...')
    
    const { data, error } = await authStore.createUser(
      newUser.value.email,
      newUser.value.password,
      newUser.value.name,
      newUser.value.role,
      {
        username: newUser.value.username,
        phone: newUser.value.phone,
        bio: newUser.value.bio,
        skip_email_verification: newUser.value.skip_email_verification
      }
    )

    if (error) {
      console.error('User creation failed:', error)
      throw error
    }

    console.log('User created successfully')
    showToast('User created successfully!', 'success')
    closeCreateUser()
    
    // Reload users to show the new user
    await loadUsers()
  } catch (error: any) {
    console.error('User creation failed:', error)
    showToast(`Failed to create user: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user: User) => {
  try {
    console.log('Toggling user status in database...')
    
    const newStatus = !user.is_active
    
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('User status update failed:', error)
      throw error
    }

    showToast(`User ${user.is_active ? 'deactivated' : 'activated'}`, 'success')
    
    // Reload users to show the updated status
    await loadUsers()
  } catch (error: any) {
    console.error('User status update failed:', error)
    showToast(`Failed to update user status: ${error.message}`, 'error')
  }
}

const exportUsers = () => {
  try {
    const dataToExport = users.value.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at
    }))
    
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Name,Email,Role,Active,Created At\n" +
      dataToExport.map(user => 
        `${user.id},${user.name || ''},${user.email},${user.role},${user.is_active},${user.created_at}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast('Users exported successfully', 'success')
  } catch (error) {
    showToast('Failed to export users', 'error')
  }
}

const applyFilters = () => {
  // Filters are reactive, no action needed
}

const clearFilters = () => {
  roleFilter.value = ''
  statusFilter.value = ''
  sortBy.value = 'created_at'
  searchQuery.value = ''
}

const bulkAction = async (action: string) => {
  if (selectedUsers.value.length === 0) {
    showToast('No users selected', 'error')
    return
  }
  
  try {
    if (action === 'activate' || action === 'deactivate') {
      const newStatus = action === 'activate'
      
      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedUsers.value)

      if (error) throw error
      
      showToast(`${selectedUsers.value.length} users ${action}d`, 'success')
      selectedUsers.value = []
      selectAll.value = false
      await loadUsers()
    } else if (action === 'export') {
      const usersToExport = users.value.filter(u => selectedUsers.value.includes(u.id))
      const dataToExport = usersToExport.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      }))
      
      const csvContent = "data:text/csv;charset=utf-8," + 
        "ID,Name,Email,Role,Active,Created At\n" +
        dataToExport.map(user => 
          `${user.id},${user.name || ''},${user.email},${user.role},${user.is_active},${user.created_at}`
        ).join("\n")
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `selected_users_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      showToast(`${selectedUsers.value.length} users exported`, 'success')
    }
  } catch (error: any) {
    console.error('Bulk action failed:', error)
    showToast(`Failed to perform bulk action: ${error.message}`, 'error')
  }
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedUsers.value = paginatedUsers.value.map(u => u.id)
  } else {
    selectedUsers.value = []
  }
}

const toggleRoleDropdown = (userId: string, event?: MouseEvent) => {
  if (roleDropdownOpen.value === userId) {
    roleDropdownOpen.value = null
    return
  }
  
  roleDropdownOpen.value = userId
  
  // Position the dropdown after the DOM updates
  nextTick(() => {
    const dropdown = document.querySelector('.role-dropdown-menu') as HTMLElement
    if (dropdown && event) {
      const target = event.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      
      // Position dropdown below the clicked element
      dropdown.style.top = `${rect.bottom + 5}px`
      dropdown.style.left = `${rect.left}px`
      
      // Adjust if dropdown would go off screen
      const dropdownRect = dropdown.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Adjust horizontal position if needed
      if (dropdownRect.right > viewportWidth) {
        dropdown.style.left = `${viewportWidth - dropdownRect.width - 10}px`
      }
      
      // Adjust vertical position if needed
      if (dropdownRect.bottom > viewportHeight) {
        dropdown.style.top = `${rect.top - dropdownRect.height - 5}px`
      }
    }
  })
}

// Close dropdown when clicking outside
const closeDropdownOnClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.role-management')) {
    roleDropdownOpen.value = null
  }
}

// Add click outside listener when component mounts
onMounted(() => {
  document.addEventListener('click', closeDropdownOnClickOutside)
})

// Remove listener when component unmounts
onUnmounted(() => {
  document.removeEventListener('click', closeDropdownOnClickOutside)
})

const handleRoleChange = async (user: User, newRole: UserRole) => {
  // Check permissions before allowing role change
  if (!canModifyRole(user, newRole)) {
    const currentUserRole = authStore.profile?.role
    
    let errorMessage = 'You do not have permission to modify this role.'
    
    // Provide specific feedback based on the restriction
    if (newRole === 'super_admin' && currentUserRole !== 'super_admin') {
      errorMessage = 'Only Super Admins can assign or remove Super Admin roles.'
    } else if (newRole === 'admin' && currentUserRole !== 'super_admin') {
      errorMessage = 'Only Super Admins can assign or remove Admin roles.'
    } else if (user.role === 'super_admin' && currentUserRole !== 'super_admin') {
      errorMessage = 'Only Super Admins can modify the roles of other Super Admins.'
    } else if (user.role === 'admin' && currentUserRole !== 'super_admin') {
      errorMessage = 'Only Super Admins can modify the roles of Admins.'
    } else if (user.id === authStore.user?.id && currentUserRole !== 'super_admin') {
      errorMessage = 'You cannot modify your own role. Contact a Super Admin for role changes.'
    }
    
    showToast(errorMessage, 'error')
    return
  }

  const userName = getUserDisplayName(user)
  const oldRoleName = formatRole(user.role)
  const newRoleName = formatRole(newRole)
  const isModifyingOwnRole = user.id === authStore.user?.id
  
  let confirmMessage = `Are you sure you want to change ${userName}'s role from "${oldRoleName}" to "${newRoleName}"?`
  
  // Special warning for super admin role changes
  if (newRole === 'super_admin' && !isModifyingOwnRole) {
    confirmMessage = `⚠️ WARNING: You are about to grant Super Admin privileges!\n\nAre you sure you want to change ${userName}'s role to "${newRoleName}"?\n\nThis will allow them to:\n• Manage all users and roles\n• Access all admin functions\n• Remove or modify your Super Admin role\n\nOnly grant this role to trusted administrators.`
  } else if (isModifyingOwnRole && user.role === 'super_admin' && newRole !== 'super_admin') {
    confirmMessage = `⚠️ WARNING: You are about to remove your own Super Admin privileges!\n\nAre you sure you want to change your role from "${oldRoleName}" to "${newRoleName}"?\n\nThis action will:\n• Remove your Super Admin access\n• Prevent you from managing other Super Admins\n• Potentially lock you out of certain admin functions\n\nThis action cannot be undone by yourself once completed.`
  }
  
  if (confirm(confirmMessage)) {
    await updateUserRole(user, newRole)
  }
  
  roleDropdownOpen.value = null
}

const updateUserRole = async (user: User, newRole: UserRole) => {
  try {
    console.log('Updating user role in database...', { userId: user.id, newRole })
    
    const { error } = await authStore.updateUserRole(user.id, newRole)
    if (error) throw error

    showToast(`User role updated successfully`, 'success')
    
    // Reload users to show the updated role
    await loadUsers()
  } catch (error: any) {
    console.error('User role update failed:', error)
    showToast(`Failed to update user role: ${error.message}`, 'error')
  }
}

const editUser = (user: User) => {
  editingUser.value = { ...user }
  showEditUser.value = true
}

const updateUser = async () => {
  if (!editingUser.value) return
  
  loading.value = true
  
  try {
    console.log('Updating user in database...')
    
    // Update user role using auth store
    const { error: roleError } = await authStore.updateUserRole(editingUser.value.id, editingUser.value.role)
    if (roleError) throw roleError

    // Update other user fields
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        name: editingUser.value.name,
        username: editingUser.value.username,
        email: editingUser.value.email,
        phone: editingUser.value.phone || null,
        bio: editingUser.value.bio || null,
        is_active: editingUser.value.is_active,
        password_reset_required: editingUser.value.password_reset_required,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingUser.value.id)

    if (error) {
      console.error('User update failed:', error)
      throw error
    }

    showToast('User updated successfully', 'success')
    closeEditUser()
    
    // Reload users to show the updated data
    await loadUsers()
  } catch (error: any) {
    console.error('User update failed:', error)
    showToast(`Failed to update user: ${error.message}`, 'error')
  } finally {
    loading.value = false
  }
}

const resetUserPassword = async (user: User) => {
  const newPassword = prompt('Enter new password for user (leave empty to generate random password):')
  if (newPassword === null) return // User cancelled
  
  try {
    console.log('Resetting user password...')
    
    const { error } = await authStore.resetUserPassword(user.id, newPassword || undefined)
    if (error) throw error

    showToast('Password reset successfully. User will be prompted to change password on next login.', 'success')
    
    // Reload users to show any updates
    await loadUsers()
  } catch (error: any) {
    console.error('Password reset failed:', error)
    showToast(`Failed to reset password: ${error.message}`, 'error')
  }
}

const deleteUser = async (user: User) => {
  if (confirm(`Are you sure you want to delete ${user.name || user.email}?`)) {
    try {
      console.log('Deleting user from database...')
      
      // Delete from users table
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', user.id)

      if (error) {
        console.error('User deletion failed:', error)
        throw error
      }

      showToast('User deleted successfully', 'success')
      
      // Reload users to show the updated list
      await loadUsers()
    } catch (error: any) {
      console.error('User deletion failed:', error)
      showToast(`Failed to delete user: ${error.message}`, 'error')
    }
  }
}

const closeCreateUser = () => {
  showCreateUser.value = false
  newUser.value = { 
    name: '', 
    username: '', 
    email: '', 
    password: '', 
    role: 'client', 
    phone: '', 
    bio: '', 
    skip_email_verification: false 
  }
}

const closeEditUser = () => {
  showEditUser.value = false
  editingUser.value = null
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getLastActive = (user: User) => {
  if (user.last_active) {
    return formatDate(user.last_active)
  }
  // If no last_active, use updated_at as fallback
  if (user.updated_at && user.updated_at !== user.created_at) {
    return formatDate(user.updated_at)
  }
  return 'Never'
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const formatRole = (role?: UserRole) => {
  if (!role) return 'Unknown'
  return role.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const getUserDisplayName = (user: any) => {
  if (user.name) return user.name
  if (user.email) return user.email.split('@')[0]
  return 'Unknown User'
}

const getUserDisplayEmail = (user: any) => {
  return user.email || 'No email provided'
}

// Check if user has counselor role (primary or additional)
const hasCounselorRole = (user: User) => {
  return user.role === 'counselor' || (user.roles && user.roles.includes('counselor'))
}

// Add counselor role to user
const addCounselorRoleToUser = async (user: User) => {
  if (hasCounselorRole(user)) {
    showToast('User already has counselor role', 'error')
    return
  }

  try {
    const { error } = await authStore.addCounselorRole(user.id)
    if (error) throw error

    showToast('Counselor role added successfully!')
    await loadUsers()
  } catch (error: any) {
    showToast('Failed to add counselor role: ' + error.message, 'error')
  }
}

// Remove counselor role from user
const removeCounselorRoleFromUser = async (user: User) => {
  if (!hasCounselorRole(user)) {
    showToast('User does not have counselor role', 'error')
    return
  }

  if (confirm(`Are you sure you want to remove counselor role from ${getUserDisplayName(user)}?`)) {
    try {
      const { error } = await authStore.removeCounselorRole(user.id)
      if (error) throw error

      showToast('Counselor role removed successfully!')
      await loadUsers()
    } catch (error: any) {
      showToast('Failed to remove counselor role: ' + error.message, 'error')
    }
  }
}

// Check if current user can modify a specific role for another user
const canModifyRole = (user: User, newRole: UserRole) => {
  const currentUserRole = authStore.profile?.role
  const isModifyingOwnRole = user.id === authStore.user?.id
  
  // Rule 1: Only Super Admins can modify Super Admin roles
  if (user.role === 'super_admin' || newRole === 'super_admin') {
    return currentUserRole === 'super_admin' && authStore.canAssignRole(newRole)
  }
  
  // Rule 2: Only Super Admins can modify Admin roles
  if (user.role === 'admin' || newRole === 'admin') {
    return currentUserRole === 'super_admin' && authStore.canAssignRole(newRole)
  }
  
  // Rule 3: Admins and Super Admins can modify Client and Counselor roles
  if ((user.role === 'client' || user.role === 'counselor') && 
      (newRole === 'client' || newRole === 'counselor')) {
    return (currentUserRole === 'admin' || currentUserRole === 'super_admin') && authStore.canAssignRole(newRole)
  }
  
  // Rule 4: Super Admins can modify their own roles (with warnings)
  if (isModifyingOwnRole && currentUserRole === 'super_admin') {
    return authStore.canAssignRole(newRole)
  }
  
  // Rule 5: Non-super admins cannot modify their own roles
  if (isModifyingOwnRole && currentUserRole !== 'super_admin') {
    return false
  }
  
  // Default: deny access
  return false
}

const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('Database connection test failed:', testError)
      showToast(`Database connection failed: ${testError.message}`, 'error')
      return false
    }

    console.log('Database connection successful')
    showToast('Database connection successful!', 'success')
    return true
  } catch (error: any) {
    console.error('Database connection test error:', error)
    showToast(`Database test failed: ${error.message}`, 'error')
    return false
  }
}

const createTestUser = async () => {
  try {
    console.log('Creating test user...')
    
    const testUser = {
      id: crypto.randomUUID(),
      name: 'Test Admin User',
      email: 'test.admin@example.com',
      role: 'admin' as UserRole,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([testUser])
      .select()

    if (error) {
      console.error('Failed to create test user:', error)
      showToast(`Failed to create test user: ${error.message}`, 'error')
      return false
    }

    console.log('Test user created successfully:', data)
    showToast('Test user created successfully!', 'success')
    
    // Reload users to show the new test user
    await loadUsers()
    return true
  } catch (error: any) {
    console.error('Test user creation error:', error)
    showToast(`Test user creation failed: ${error.message}`, 'error')
    return false
  }
}

const testRLSAndPermissions = async () => {
  try {
    console.log('=== TESTING RLS AND PERMISSIONS ===')
    
    // Test 1: Basic count query
    console.log('Test 1: Basic count query...')
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    console.log('Count result:', { count, countError })
    
    // Test 2: Query with specific columns
    console.log('Test 2: Query with specific columns...')
    const { data: specificData, error: specificError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, is_active, created_at')
    
    console.log('Specific columns result:', { data: specificData, error: specificError, count: specificData?.length })
    
    // Test 3: Query all columns
    console.log('Test 3: Query all columns...')
    const { data: allData, error: allError } = await supabaseAdmin
      .from('users')
      .select('*')
    
    console.log('All columns result:', { data: allData, error: allError, count: allData?.length })
    
    // Test 4: Try with RLS bypass (if service role)
    console.log('Test 4: Service role permissions test...')
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    console.log('Has service role key:', !!serviceRoleKey)
    console.log('Service role key (first 20 chars):', serviceRoleKey?.substring(0, 20))
    
    // Test 5: Check current user/session
    const { data: sessionData } = await supabaseAdmin.auth.getSession()
    console.log('Current session:', sessionData)
    
    showToast('RLS tests completed - check console for details', 'success')
  } catch (error: any) {
    console.error('RLS test error:', error)
    showToast(`RLS test failed: ${error.message}`, 'error')
  }
}

const loadAllUsersWithRLSBypass = async () => {
  loading.value = true
  try {
    console.log('=== ATTEMPTING TO LOAD ALL USERS WITH RLS BYPASS ===')
    
    // Method 1: Try with service role client and explicit RLS bypass
    console.log('Method 1: Service role with explicit headers...')
    const { data: method1Data, error: method1Error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('Method 1 result:', { data: method1Data, error: method1Error, count: method1Data?.length })
    
    if (method1Data && method1Data.length > 1) {
      console.log('✅ Method 1 successful! Found all users.')
      users.value = method1Data
      showToast(`Successfully loaded ${method1Data.length} users!`, 'success')
      return
    }
    
    // Method 2: Try direct SQL approach (if supported)
    console.log('Method 2: Trying rpc call...')
    const { data: method2Data, error: method2Error } = await supabaseAdmin
      .rpc('get_all_users_admin')
    
    console.log('Method 2 result:', { data: method2Data, error: method2Error })
    
    if (!method2Error && method2Data && method2Data.length > 1) {
      console.log('✅ Method 2 successful! Found all users via RPC.')
      users.value = method2Data
      showToast(`Successfully loaded ${method2Data.length} users via RPC!`, 'success')
      return
    }
    
    // Method 3: Try creating a new admin client with different config
    console.log('Method 3: Creating fresh admin client...')
    const freshAdminClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    const { data: method3Data, error: method3Error } = await freshAdminClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('Method 3 result:', { data: method3Data, error: method3Error, count: method3Data?.length })
    
    if (method3Data && method3Data.length > 0) {
      console.log('✅ Method 3 successful! Found users with fresh client.')
      users.value = method3Data
      showToast(`Successfully loaded ${method3Data.length} users with fresh client!`, 'success')
      return
    }
    
    // If all methods fail, show diagnostic info
    console.log('❌ All methods failed. Showing diagnostic info...')
    showToast('All RLS bypass methods failed. Check console for details.', 'error')
    
    // Fall back to regular method
    await loadUsers()
    
  } catch (error: any) {
    console.error('RLS bypass failed:', error)
    showToast(`RLS bypass failed: ${error.message}`, 'error')
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
  
  // Setup responsive layout
  const cleanup = setupResponsiveLayout()
  
  onUnmounted(() => {
    cleanup()
  })
})
</script>

<style scoped>
.user-management {
  padding: 0.75rem 1rem 2rem 1rem; /* Added bottom padding for scrolling */
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
  .user-management {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem 1rem 3rem 1rem !important; /* Extra bottom padding for mobile */
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .user-management.sidebar-collapsed {
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

.stat-item.active-users {
  color: #10b981;
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

.action-btn.export:hover {
  color: #10b981;
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
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
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: clamp(0.75rem, 2vw, 1rem);
  margin-bottom: clamp(1.5rem, 3vw, 2rem);
}

.stat-card {
  background: white;
  border-radius: clamp(6px, 1vw, 8px);
  padding: clamp(1rem, 2.5vw, 1.5rem);
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-height: 70px;
}

.stat-icon {
  width: clamp(32px, 5vw, 40px);
  height: clamp(32px, 5vw, 40px);
  border-radius: clamp(6px, 1vw, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-icon.user { background: #3b82f6; }
.stat-icon.counselor { background: #10b981; }
.stat-icon.admin { background: #B91C1C; }
.stat-icon.active { background: #8b5cf6; }

.stat-content {
  min-width: 0;
  flex: 1;
}

.stat-content h3 {
  margin: 0;
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  color: #B91C1C;
  line-height: 1.2;
}

.stat-content p {
  margin: 0;
  color: #666;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  font-weight: 500;
}

.stat-content small {
  display: block;
  font-size: clamp(0.75rem, 1.25vw, 0.8rem);
  color: #666;
  margin-top: 0.125rem;
}

.filters-section {
  background: white;
  border-radius: clamp(6px, 1vw, 8px);
  padding: clamp(1rem, 2.5vw, 1.5rem);
  margin-bottom: clamp(1.5rem, 3vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 1.5vw, 1rem);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1vw, 0.75rem);
  width: 100%;
}

.search-bar i {
  color: #B91C1C;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  flex-shrink: 0;
}

.search-bar input {
  padding: clamp(0.5rem, 1.5vw, 0.75rem);
  border: 1px solid #F8C9C9;
  border-radius: clamp(4px, 0.5vw, 6px);
  width: 100%;
  flex: 1;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
}

.filters {
  display: flex;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  flex-wrap: wrap;
  align-items: center;
}

.filters select {
  padding: clamp(0.5rem, 1.5vw, 0.75rem);
  border: 1px solid #F8C9C9;
  border-radius: clamp(4px, 0.5vw, 6px);
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  min-width: 120px;
  flex: 1;
}

.clear-filters-btn {
  background: none;
  border: none;
  color: #B91C1C;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.clear-filters-btn:hover {
  color: #991b1b;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow-x: auto;
  overflow-y: visible;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  position: relative;
  margin-bottom: 2rem; /* Increased margin for better scrolling */
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 800px;
}

.users-table th {
  background: #f8f9fa;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
  letter-spacing: 0.025em;
  white-space: nowrap;
  border-bottom: 2px solid #e9ecef;
}

.users-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f3f4;
  vertical-align: middle;
  line-height: 1.4;
}

.checkbox-col {
  width: 50px;
  min-width: 50px;
}

.user-cell {
  min-width: 250px;
  width: 28%;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  line-height: 1.3;
  text-align: center;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  width: 100%;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: #B91C1C;
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.user-email {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.3;
  text-align: center;
  word-wrap: break-word;
  word-break: break-all;
  opacity: 0.9;
  width: 100%;
}

.role-cell {
  min-width: 140px;
  width: 12%;
  position: relative;
  overflow: visible;
}

.role-management {
  position: relative;
  cursor: pointer;
  overflow: visible;
}

.role-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  min-height: 2rem;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.role-display:hover {
  background-color: #f8f9fa;
}

.role-dropdown-icon {
  margin-left: 0.5rem;
  color: #666;
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.role-management:hover .role-dropdown-icon {
  color: #B91C1C;
}

.role-dropdown-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  border: 1px solid #e5e7eb;
  min-width: 300px;
  width: max-content;
  max-height: 400px;
  overflow-y: auto;
}

.role-dropdown-header {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  color: #333;
  font-size: 0.9rem;
}

.role-dropdown-options {
  padding: 0.5rem 0;
}

.role-dropdown-option {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.role-dropdown-option:last-child {
  border-bottom: none;
}

.role-dropdown-option:hover:not(.disabled) {
  background-color: #f8f9fa;
}

.role-dropdown-option.active {
  background-color: #f0f9ff;
  border-left: 3px solid #B91C1C;
}

.role-dropdown-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.role-option-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-option-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.role-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.role-indicator.client {
  background: #3b82f6;
}

.role-indicator.counselor {
  background: #10b981;
}

.role-indicator.admin {
  background: #B91C1C;
}

.role-indicator.super_admin {
  background: #92400e;
}

.role-label {
  font-weight: 500;
  color: #333;
}

.role-option-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-check {
  color: #10b981;
  font-size: 0.9rem;
}

.role-plus {
  color: #666;
  font-size: 0.8rem;
}

.role-lock {
  color: #dc2626;
  font-size: 0.8rem;
}

.role-dropdown {
  position: relative;
}

.role-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  display: inline-block;
  min-width: fit-content;
  line-height: 1.2;
}

.role-badge.client {
  background: #dbeafe;
  color: #1e40af;
}

.role-badge.counselor {
  background: #d1fae5;
  color: #047857;
}

.role-badge.admin {
  background: #F8C9C9;
  color: #B91C1C;
}

.role-badge.super_admin {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.additional {
  opacity: 0.8;
  font-size: 0.7rem;
  margin-left: 0.25rem;
}

.role-badge.clickable {
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  padding: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dropdown-item {
  display: block;
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item.active {
  background: #F8C9C9;
}

.dropdown-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #999;
}

.dropdown-item.disabled:hover {
  background: none;
}

.checkbox-label.disabled,
.radio-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label.disabled input,
.radio-label.disabled input {
  cursor: not-allowed;
}

.checkbox-label .fas.fa-lock,
.radio-label .fas.fa-lock {
  color: #999;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.status-cell {
  min-width: 90px;
  width: 8%;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #047857;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #dc2626;
}

.date-cell {
  min-width: 110px;
  width: 10%;
}

.date {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions-cell {
  min-width: 320px;
  width: 25%;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  margin: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-height: 36px;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  white-space: nowrap;
}

.action-btn.edit {
  color: #B91C1C;
  border-color: #F8C9C9;
}

.action-btn.edit:hover {
  color: #991b1b;
  background: #F8C9C9;
  border-color: #B91C1C;
}

.action-btn.warning {
  color: #dc2626;
}

.action-btn.warning:hover {
  color: #991b1b;
}

.action-btn.success {
  color: #10b981;
}

.action-btn.success:hover {
  color: #047857;
}

.action-btn.info {
  color: #3b82f6;
  border-color: #dbeafe;
}

.action-btn.info:hover {
  color: #1d4ed8;
  background: #dbeafe;
  border-color: #3b82f6;
}

.action-btn.counselor {
  color: #10b981;
  border-color: #d1fae5;
}

.action-btn.counselor:hover {
  color: #047857;
  background: #d1fae5;
  border-color: #10b981;
}

.action-btn.remove-counselor {
  color: #f59e0b;
  border-color: #fef3c7;
}

.action-btn.remove-counselor:hover {
  color: #d97706;
  background: #fef3c7;
  border-color: #f59e0b;
}

.action-btn.danger {
  color: #dc2626;
  border-color: #fee2e2;
}

.action-btn.danger:hover {
  color: #991b1b;
  background: #fee2e2;
  border-color: #dc2626;
}

.mobile-action-btn.reset {
  background: #3b82f6;
  color: white;
}

.mobile-action-btn.reset:hover {
  background: #1d4ed8;
}

.mobile-action-btn.counselor {
  background: #10b981;
  color: white;
}

.mobile-action-btn.counselor:hover {
  background: #047857;
}

.mobile-action-btn.remove-counselor {
  background: #f59e0b;
  color: white;
}

.mobile-action-btn.remove-counselor:hover {
  background: #d97706;
}

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
  padding: clamp(0.5rem, 2vw, 1rem);
}

.modal {
  background: white;
  border-radius: clamp(8px, 1.5vw, 12px);
  width: 100%;
  max-width: clamp(400px, 90vw, 500px);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

.modal-header {
  padding: clamp(1rem, 3vw, 1.5rem);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  color: #B91C1C;
  font-size: clamp(1.1rem, 2.5vw, 1.25rem);
}

.modal-close {
  background: none;
  border: none;
  font-size: clamp(1.25rem, 2.5vw, 1.5rem);
  cursor: pointer;
  color: #666;
  min-width: clamp(32px, 6vw, 40px);
  min-height: clamp(32px, 6vw, 40px);
}

.modal-body {
  padding: clamp(1rem, 3vw, 1.5rem);
}

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

.checkbox-group,
.radio-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.checkbox-label,
.radio-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0;
}

.checkbox-label input[type="checkbox"],
.radio-label input[type="radio"] {
  width: auto;
  margin: 0;
}

.form-group small {
  color: #666;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.role-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

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

/* Enhanced Pagination Styles */
.pagination-section {
  background: white;
  border-radius: 8px;
  margin-top: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow: hidden;
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.875rem;
  color: #666;
}

.pagination-info .results-count {
  font-weight: 600;
  color: #333;
}

.pagination-info .page-info {
  color: #B91C1C;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  min-height: 40px;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #B91C1C;
  color: #B91C1C;
}

.pagination-btn.first,
.pagination-btn.last {
  font-weight: 600;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
  margin: 0 1rem;
}

.page-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.page-btn:hover {
  background: #f8f9fa;
  border-color: #B91C1C;
  color: #B91C1C;
}

.page-btn.active {
  background: #B91C1C;
  color: white;
  border-color: #B91C1C;
  font-weight: 600;
}

.page-size-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  font-size: 0.875rem;
}

.page-size-selector label {
  color: #666;
  font-weight: 500;
}

.page-size-selector select {
  padding: 0.375rem 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 0.875rem;
  min-width: 80px;
}

.bottom-spacer {
  height: 2rem;
  flex-shrink: 0;
}

/* Responsive Design */
@media screen and (max-width: 1200px) {
  .users-table {
    min-width: 900px;
  }
  
  .users-table th,
  .users-table td {
    padding: clamp(0.75rem, 1.5vw, 1rem) clamp(0.5rem, 1.5vw, 0.75rem);
  }
}

@media screen and (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: clamp(0.5rem, 1.5vw, 0.75rem);
  }
  
  .filters {
    flex-wrap: wrap;
    gap: clamp(0.5rem, 1vw, 0.75rem);
  }
  
  .filters select {
    min-width: 100px;
    flex: 1 1 auto;
  }
  
  .header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: clamp(0.75rem, 1.5vw, 1rem);
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media screen and (max-width: 768px) {
  .user-management {
    padding: clamp(0.75rem, 3vw, 1rem);
  }
  
  .header-actions .btn {
    flex: 1;
    min-width: 0;
    padding: clamp(0.5rem, 2vw, 0.75rem);
    font-size: clamp(0.8rem, 1.5vw, 0.9rem);
  }
  
  .header-actions .btn span {
    display: none;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: clamp(0.5rem, 1.5vw, 0.75rem);
  }
  
  .stat-card {
    padding: clamp(0.75rem, 2vw, 1rem);
    gap: clamp(0.5rem, 1.5vw, 0.75rem);
    min-height: 60px;
  }
  
  .filters-section {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .search-bar {
    margin-bottom: 1rem;
  }
  
  .search-bar input {
    width: 100%;
    padding: 0.75rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .filters {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .filters select {
    width: 100%;
    padding: 0.75rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .clear-filters-btn {
    padding: 0.75rem;
    border: 1px solid #F8C9C9;
    border-radius: 4px;
    background: white;
    width: 100%;
    justify-content: center;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  /* Hide desktop cards on mobile */
  .desktop-user-list {
    display: none !important;
  }
  
  /* Show mobile cards */
  .mobile-user-list {
    display: block !important;
  }
  
  .bulk-actions {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .bulk-info {
    text-align: center;
    font-weight: 600;
    color: #B91C1C;
  }
  
  .bulk-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .bulk-buttons .btn {
    flex: 1;
    min-width: 0;
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .bulk-buttons .btn span {
    display: none;
  }
  
  .modal {
    margin: 0.5rem;
    max-height: calc(100vh - 1rem);
    overflow-y: auto;
  }
  
  .modal-header,
  .modal-body {
    padding: 1rem;
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
  
  .form-group input,
  .form-group select {
    padding: 0.75rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }
  
  .loading-state,
  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
  }
  
  .empty-state h3 {
    font-size: 1.25rem;
  }
  
  .empty-state p {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
  

}

@media screen and (max-width: 480px) {
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .header-actions .btn {
    width: 100%;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: clamp(0.5rem, 2vw, 0.75rem);
    min-height: auto;
  }
  
  .stat-icon {
    margin-bottom: 0.25rem;
  }
  
  .bulk-buttons {
    flex-direction: column;
    gap: clamp(0.25rem, 1vw, 0.5rem);
  }
  
  .bulk-buttons .btn {
    width: 100%;
  }
  
  .toast {
    bottom: clamp(0.5rem, 2vw, 1rem);
    right: clamp(0.5rem, 2vw, 1rem);
    left: clamp(0.5rem, 2vw, 1rem);
    text-align: center;
    font-size: clamp(0.8rem, 1.5vw, 0.9rem);
  }
  
  /* Mobile card improvements for small screens */
  .mobile-user-details {
    grid-template-columns: 1fr;
    gap: clamp(0.375rem, 1vw, 0.5rem);
  }
  
  .mobile-action-btn span {
    display: none;
  }
  
  .mobile-action-btn {
    min-width: clamp(60px, 15vw, 70px);
  }
  
  /* Mobile pagination */
  .pagination-section {
    margin-top: 1rem;
  }
  
  .pagination-info {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .pagination-controls {
    gap: 0.25rem;
  }
  
  .pagination-btn span {
    display: none;
  }
  
  .pagination-btn {
    min-width: 44px;
    padding: 0.5rem;
  }
  
  .page-numbers {
    margin: 0 0.5rem;
    gap: 0.125rem;
  }
  
  .page-btn {
    min-width: 36px;
    padding: 0.375rem;
  }
  
  .page-size-selector {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Very small screens */
@media screen and (max-width: 320px) {
  .mobile-action-btn {
    flex: 1 1 calc(50% - 0.25rem);
    max-width: calc(50% - 0.25rem);
  }
  
  .mobile-user-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(0.25rem, 1vw, 0.375rem);
  }
  
  .filters select {
    min-width: 80px;
  }
}

/* Desktop User Cards (same layout as mobile) */
.desktop-user-list {
  display: block;
}

.desktop-user-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid #f0f0f0;
}

.desktop-user-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.desktop-user-header input[type="checkbox"] {
  margin: 0;
  margin-top: 0.25rem;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.desktop-user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  flex: 1;
  min-width: 0;
}

.desktop-user-name {
  font-weight: 600;
  color: #333;
  word-break: break-word;
  font-size: 1rem;
  line-height: 1.3;
  text-align: center;
  width: 100%;
}

.desktop-user-email {
  font-size: 0.85rem;
  color: #666;
  word-break: break-all;
  line-height: 1.3;
  text-align: center;
  width: 100%;
  opacity: 0.9;
}

.desktop-user-details {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  background: #f9f9f9;
  padding: 0.75rem;
  border-radius: 6px;
}

.desktop-detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.desktop-detail-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.desktop-detail-value {
  font-size: 0.9rem;
  color: #333;
  line-height: 1.3;
}

.desktop-user-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.desktop-action-btn {
  flex: 1;
  min-width: 120px;
  padding: 0.6rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  line-height: 1.2;
}

.desktop-action-btn.edit {
  color: #B91C1C;
  border-color: #F8C9C9;
}

.desktop-action-btn.edit:hover {
  background: #F8C9C9;
  color: #991b1b;
}

.desktop-action-btn.reset {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.desktop-action-btn.reset:hover {
  background: #1d4ed8;
}

.desktop-action-btn.counselor {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.desktop-action-btn.counselor:hover {
  background: #047857;
}

.desktop-action-btn.remove-counselor {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.desktop-action-btn.remove-counselor:hover {
  background: #d97706;
}

.desktop-action-btn.toggle {
  color: #10b981;
  border-color: #d1fae5;
}

.desktop-action-btn.toggle:hover {
  background: #d1fae5;
  color: #047857;
}

.desktop-action-btn.delete {
  color: #dc2626;
  border-color: #fee2e2;
}

.desktop-action-btn.delete:hover {
  background: #fee2e2;
  color: #991b1b;
}

/* Mobile User Cards */
.mobile-user-list {
  display: none;
}

@media screen and (max-width: 768px) {
  .mobile-user-list {
    display: block;
  }
  
  .mobile-user-card {
    background: white;
    border-radius: clamp(6px, 1vw, 8px);
    padding: clamp(0.75rem, 2.5vw, 1rem);
    margin-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid #f0f0f0;
  }
  
  .mobile-user-header {
    display: flex;
    align-items: flex-start;
    gap: clamp(0.5rem, 1.5vw, 0.75rem);
    margin-bottom: clamp(0.75rem, 2vw, 1rem);
  }
  
  .mobile-user-header input[type="checkbox"] {
    margin: 0;
    margin-top: 0.25rem;
    flex-shrink: 0;
    width: clamp(16px, 3vw, 20px);
    height: clamp(16px, 3vw, 20px);
  }
  
  .user-avatar {
    flex-shrink: 0;
    width: clamp(32px, 6vw, 40px);
    height: clamp(32px, 6vw, 40px);
  }
  
  .mobile-user-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    flex: 1;
    min-width: 0;
  }
  
  .mobile-user-name {
    font-weight: 600;
    color: #333;
    word-break: break-word;
    font-size: clamp(0.9rem, 2vw, 1rem);
    line-height: 1.3;
    text-align: center;
    width: 100%;
  }
  
  .mobile-user-email {
    font-size: clamp(0.8rem, 1.5vw, 0.85rem);
    color: #666;
    word-break: break-all;
    line-height: 1.3;
    text-align: center;
    width: 100%;
    opacity: 0.9;
  }
  
  .mobile-user-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(0.5rem, 1.5vw, 0.75rem);
    margin-bottom: clamp(0.75rem, 2vw, 1rem);
    background: #f9f9f9;
    padding: clamp(0.5rem, 1.5vw, 0.75rem);
    border-radius: clamp(4px, 0.75vw, 6px);
  }
  
  .mobile-detail-item {
    display: flex;
    flex-direction: column;
    gap: clamp(0.125rem, 0.5vw, 0.25rem);
  }
  
  .mobile-detail-label {
    font-size: clamp(0.7rem, 1.25vw, 0.75rem);
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .mobile-detail-value {
    font-size: clamp(0.8rem, 1.5vw, 0.9rem);
    color: #333;
    line-height: 1.3;
  }
  
  .mobile-user-actions {
    display: flex;
    gap: clamp(0.375rem, 1vw, 0.5rem);
    flex-wrap: wrap;
  }
  
  .mobile-action-btn {
    flex: 1;
    min-width: clamp(70px, 18vw, 80px);
    padding: clamp(0.5rem, 1.5vw, 0.6rem) clamp(0.375rem, 1vw, 0.5rem);
    border-radius: clamp(4px, 0.75vw, 6px);
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    font-size: clamp(0.75rem, 1.25vw, 0.8rem);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.125rem, 0.5vw, 0.25rem);
    font-weight: 500;
    transition: all 0.2s ease;
    line-height: 1.2;
  }
  
  .mobile-action-btn.edit {
    color: #B91C1C;
    border-color: #F8C9C9;
  }
  
  .mobile-action-btn.edit:hover,
  .mobile-action-btn.edit:active {
    background: #F8C9C9;
    color: #991b1b;
  }
  
  .mobile-action-btn.toggle {
    color: #10b981;
    border-color: #d1fae5;
  }
  
  .mobile-action-btn.toggle:hover,
  .mobile-action-btn.toggle:active {
    background: #d1fae5;
    color: #047857;
  }
  
  .mobile-action-btn.delete {
    color: #dc2626;
    border-color: #fee2e2;
  }
  
  .mobile-action-btn.delete:hover,
  .mobile-action-btn.delete:active {
    background: #fee2e2;
    color: #991b1b;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .action-btn,
  .mobile-action-btn,
  .clear-filters-btn,
  .role-badge.clickable {
    min-height: 44px;
    min-width: 44px;
  }
  
  .users-table td {
    padding: 1.25rem 1rem;
  }
  
  .stat-card:hover {
    transform: none;
  }
  
  .stat-card:active {
    transform: scale(0.98);
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .stat-card,
  .filters-section,
  .table-container,
  .mobile-user-card {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

/* Landscape orientation on mobile */
@media screen and (max-width: 768px) and (orientation: landscape) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .mobile-user-details {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Very small screens */
@media screen and (max-width: 320px) {
  .mobile-user-details {
    grid-template-columns: 1fr;
  }
  
  .mobile-user-actions {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .mobile-action-btn {
    width: 100%;
    min-width: auto;
  }
}

/* Additional button styles */
.btn.btn-info {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
}

.btn.btn-info:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn.btn-warning {
  background: #f59e0b;
  color: white;
  border: 1px solid #f59e0b;
}

.btn.btn-warning:hover {
  background: #d97706;
  border-color: #d97706;
}

.btn.btn-success {
  background: #10b981;
  color: white;
  border: 1px solid #10b981;
}

.btn.btn-success:hover {
  background: #047857;
  border-color: #047857;
}

/* Empty state styling */
.empty-state-note {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  color: #856404;
  font-size: 0.9rem;
  line-height: 1.5;
}

.empty-state-note i {
  color: #f59e0b;
  margin-right: 0.5rem;
}

.empty-state-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}

.empty-state-actions .btn {
  min-width: 120px;
}
</style> 
