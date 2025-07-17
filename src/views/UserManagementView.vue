<template>
  <div class="user-management">
    <div class="header">
      <div class="header-left">
        <h1>User Management</h1>
        <p>Manage users for the abortion support platform</p>
      </div>
      <div class="header-actions">
        <button @click="exportUsers" class="btn btn-secondary">
          <i class="fas fa-download"></i>
          <span>Export</span>
        </button>
        <button class="btn btn-primary" @click="showCreateUser = true">
          <i class="fas fa-plus"></i>
          <span>Create User</span>
        </button>
      </div>
    </div>



    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon user">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.total }}</h3>
          <p>Total Users</p>
          <small>All registered users</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon counselor">
          <i class="fas fa-user-md"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.counselors }}</h3>
          <p>Counselors</p>
          <small>Support providers</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon admin">
          <i class="fas fa-user-shield"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.admins }}</h3>
          <p>Admins</p>
          <small>System administrators</small>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.active }}</h3>
          <p>Active</p>
          <small>Currently active users</small>
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
          placeholder="Search users by name or email..."
        />
      </div>
      
      <div class="filters">
        <select v-model="roleFilter" @change="applyFilters">
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="counselor">Counselors</option>
          <option value="admin">Admins</option>
          <option value="super_admin">Super Admins</option>
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

        <button @click="clearFilters" class="clear-filters-btn">
          <i class="fas fa-times"></i>
          <span>Clear</span>
        </button>
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
            <div class="user-avatar">
              <i class="fas fa-user"></i>
            </div>
            <div class="mobile-user-info">
              <div class="mobile-user-name">{{ getUserDisplayName(user) }}</div>
              <div class="mobile-user-email">{{ getUserDisplayEmail(user) }}</div>
            </div>
          </div>
          
          <div class="mobile-user-details">
            <div class="mobile-detail-item">
              <div class="mobile-detail-label">Roles</div>
              <div class="mobile-detail-value">
                <span v-if="!user.roles || user.roles.length === 0" class="role-badge user">
                  User
                </span>
                <span v-else v-for="role in user.roles" :key="role" class="role-badge" :class="role">
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
              <div class="mobile-detail-value">{{ user.last_login ? formatDate(user.last_login) : 'Never' }}</div>
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

      <table class="users-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
            </th>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="user.id" class="user-row">
            <td class="checkbox-col">
              <input type="checkbox" v-model="selectedUsers" :value="user.id">
            </td>
            
            <td class="user-cell">
              <div class="user-info">
                <div class="user-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                  <div class="user-name" :title="getUserDisplayName(user)">{{ getUserDisplayName(user) }}</div>
                  <div class="user-id" :title="user.id">ID: {{ user.id.slice(0, 8) }}...</div>
                </div>
              </div>
            </td>
            
            <td class="email-cell">
              <div class="email" :title="getUserDisplayEmail(user)">{{ getUserDisplayEmail(user) }}</div>
            </td>
            
            <td class="role-cell">
              <div class="role-management" @click="toggleRoleDropdown(user.id, $event)">
                <div class="role-display">
                  <span v-if="!user.roles || user.roles.length === 0" class="role-badge user">
                    User
                  </span>
                  <span v-else v-for="role in user.roles" :key="role" class="role-badge" :class="role">
                    {{ formatRole(role) }}
                  </span>
                  <i class="fas fa-chevron-down role-dropdown-icon"></i>
                </div>
                
                <!-- Role Dropdown -->
                <div v-if="roleDropdownOpen === user.id" class="role-dropdown-menu" @click.stop>
                  <div class="role-dropdown-header">
                    <strong>Manage Roles for {{ getUserDisplayName(user) }}</strong>
                  </div>
                  <div class="role-dropdown-options">
                    <div 
                      v-for="role in roleOptions" 
                      :key="role.value"
                      class="role-dropdown-option"
                      :class="{ 
                        active: user.roles?.includes(role.value),
                        disabled: !canModifyRole(user, role.value)
                      }"
                      @click="handleRoleToggle(user, role.value)"
                    >
                      <div class="role-option-content">
                        <div class="role-option-left">
                          <span class="role-indicator" :class="role.value"></span>
                          <span class="role-label">{{ role.label }}</span>
                        </div>
                        <div class="role-option-right">
                          <i v-if="user.roles?.includes(role.value)" class="fas fa-check role-check"></i>
                          <i v-else class="fas fa-plus role-plus"></i>
                          <i v-if="!canModifyRole(user, role.value)" class="fas fa-lock role-lock" title="Insufficient permissions"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
            
            <td class="status-cell">
              <span class="status-badge" :class="user.is_active ? 'active' : 'inactive'">
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            
            <td class="date-cell">
              <div class="date">{{ formatDate(user.created_at) }}</div>
            </td>
            
            <td class="date-cell">
              <div class="date">{{ getLastActive(user) }}</div>
            </td>
            
            <td class="actions-cell">
              <div class="actions">
                <button @click="editUser(user)" class="action-btn edit" title="Edit User">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="resetUserPassword(user)" class="action-btn info" title="Reset Password">
                  <i class="fas fa-key"></i>
                </button>
                <button 
                  @click="toggleUserStatus(user)" 
                  class="action-btn" 
                  :class="user.is_active ? 'warning' : 'success'"
                  :title="user.is_active ? 'Deactivate User' : 'Activate User'"
                >
                  <i class="fas" :class="user.is_active ? 'fa-pause' : 'fa-play'"></i>
                </button>
                <button @click="deleteUser(user)" class="action-btn danger" title="Delete User">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

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
              <label>Roles *</label>
              <div class="checkbox-group">
                <label class="checkbox-label" v-for="role in roleOptions" :key="role.value" :class="{ disabled: !authStore.canAssignRole(role.value) }">
                  <input type="checkbox" v-model="newUser.roles" :value="role.value" :disabled="!authStore.canAssignRole(role.value)" />
                  {{ role.label }}
                  <i v-if="!authStore.canAssignRole(role.value)" class="fas fa-lock" title="Insufficient permissions to assign this role"></i>
                </label>
              </div>
              <small>Select one or more roles for this user</small>
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
              <label>Roles *</label>
              <div class="checkbox-group">
                <label class="checkbox-label" v-for="role in roleOptions" :key="role.value" :class="{ disabled: !canModifyRole(editingUser!, role.value) }">
                  <input type="checkbox" v-model="editingUser!.roles" :value="role.value" :disabled="!canModifyRole(editingUser!, role.value)" />
                  {{ role.label }}
                  <i v-if="!canModifyRole(editingUser!, role.value)" class="fas fa-lock" title="Insufficient permissions to modify this role"></i>
                </label>
              </div>
              <small>Select one or more roles for this user</small>
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
import type { User, UserRole } from '@/types'

const authStore = useAuthStore()

const users = ref<User[]>([])
const loading = ref(false)
const syncingUsers = ref(false)
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
const itemsPerPage = ref(10)

const newUser = ref({
  name: '',
  username: '',
  email: '',
  password: '',
  roles: [] as UserRole[],
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
  { value: 'user' as UserRole, label: 'User' },
  { value: 'counselor' as UserRole, label: 'Counselor' },
  { value: 'admin' as UserRole, label: 'Admin' },
  { value: 'super_admin' as UserRole, label: 'Super Admin' }
]

const stats = computed(() => ({
  total: users.value.length,
  counselors: users.value.filter(u => u.roles?.includes('counselor')).length,
  admins: users.value.filter(u => u.roles?.includes('admin') || u.roles?.includes('super_admin')).length,
  active: users.value.filter(u => u.is_active).length
}))

const filteredUsers = computed(() => {
  let filtered = users.value

  if (roleFilter.value) {
    filtered = filtered.filter(u => u.roles?.includes(roleFilter.value as UserRole))
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

const loadUsers = async () => {
  loading.value = true
  try {
    console.log('Loading users from Supabase using admin client...')
    console.log('Current user session:', await supabase.auth.getSession())
    
    // Try to get the count first to see if RLS is blocking
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    console.log('Users table count:', count, 'Count error:', countError)
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Raw query result:', { data, error })
    console.log('Data length:', data?.length)
    console.log('Error details:', error)

    if (error) {
      console.error('Error loading users:', error)
      showToast(`Failed to load users: ${error.message}`, 'error')
      users.value = []
    } else {
      console.log('Users loaded successfully:', data)
      console.log('First user data:', data?.[0])
      
      // Transform users to handle both old single role and new roles array
      const transformedUsers = (data || []).map(user => {
        let roles: UserRole[] = []
        
        if (user.roles && Array.isArray(user.roles)) {
          // Handle existing roles array, normalize 'client' to 'user'
          roles = user.roles.map((role: string) => role === 'client' ? 'user' : role)
        } else if (user.role) {
          // Handle old single 'role' field, normalize 'client' to 'user'
          roles = [user.role === 'client' ? 'user' : user.role]
        } else {
          // Default to 'user' role
          roles = ['user']
        }
        
        return {
          ...user,
          roles
        }
      })
      
      console.log('Transformed user data:', transformedUsers[0])
      users.value = transformedUsers
    }
  } catch (error: any) {
    console.error('Failed to load users:', error)
    showToast(`Failed to load users: ${error.message}`, 'error')
    users.value = []
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password || !newUser.value.roles.length) {
    showToast('Please fill in all required fields', 'error')
    return
  }

  loading.value = true
  
  try {
    console.log('Creating user with auth store...')
    
    // Use the enhanced auth store method
    const { data, error } = await authStore.createUser(
      newUser.value.email,
      newUser.value.password,
      newUser.value.name,
      newUser.value.roles,
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

// Missing functions
const exportUsers = () => {
  showToast('Export functionality not implemented yet', 'error')
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

const bulkAction = (action: string) => {
  if (selectedUsers.value.length === 0) {
    showToast('No users selected', 'error')
    return
  }
  
  if (action === 'activate' || action === 'deactivate') {
    const newStatus = action === 'activate'
    selectedUsers.value.forEach(userId => {
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        users.value[userIndex] = {
          ...users.value[userIndex],
          is_active: newStatus
        }
      }
    })
    showToast(`${selectedUsers.value.length} users ${action}d`, 'success')
    selectedUsers.value = []
    selectAll.value = false
  } else if (action === 'export') {
    showToast('Export functionality not implemented yet', 'error')
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

const handleRoleToggle = async (user: User, roleToToggle: UserRole) => {
  // Check permissions before allowing role change
  if (!canModifyRole(user, roleToToggle)) {
    const currentUserRoles = authStore.profile?.roles || []
    const currentUserIsSuperAdmin = currentUserRoles.includes('super_admin')
    const targetUserIsSuperAdmin = user.roles?.includes('super_admin') || false
    const targetUserIsAdmin = user.roles?.includes('admin') || false
    
    let errorMessage = 'You do not have permission to modify this role.'
    
    // Provide specific feedback based on the restriction
    if (roleToToggle === 'super_admin' && !currentUserIsSuperAdmin) {
      errorMessage = 'Only Super Admins can assign or remove Super Admin roles.'
    } else if (roleToToggle === 'admin' && !currentUserIsSuperAdmin) {
      errorMessage = 'Only Super Admins can assign or remove Admin roles.'
    } else if (targetUserIsSuperAdmin && !currentUserIsSuperAdmin) {
      errorMessage = 'Only Super Admins can modify the roles of other Super Admins.'
    } else if (targetUserIsAdmin && !currentUserIsSuperAdmin) {
      errorMessage = 'Only Super Admins can modify the roles of Admins.'
    } else if (user.id === authStore.user?.id && !currentUserIsSuperAdmin) {
      errorMessage = 'You cannot modify your own roles. Contact a Super Admin for role changes.'
    }
    
    showToast(errorMessage, 'error')
    return
  }

  const currentRoles = user.roles || []
  const hasRole = currentRoles.includes(roleToToggle)
  const userName = getUserDisplayName(user)
  const roleName = formatRole(roleToToggle)
  const isModifyingOwnRole = user.id === authStore.user?.id
  const isSuperAdminRole = roleToToggle === 'super_admin'
  
  let confirmMessage = ''
  let newRoles = [...currentRoles]
  
  if (hasRole) {
    // Removing a role
    confirmMessage = `Are you sure you want to remove the "${roleName}" role from ${userName}?`
    
    // Special warning for super admins removing their own super admin role
    if (isModifyingOwnRole && isSuperAdminRole) {
      confirmMessage = `⚠️ WARNING: You are about to remove your own Super Admin privileges!\n\nAre you sure you want to remove the "${roleName}" role from ${userName}?\n\nThis action will:\n• Remove your Super Admin access\n• Prevent you from managing other Super Admins\n• Potentially lock you out of certain admin functions\n\nThis action cannot be undone by yourself once completed.`
    }
    
    newRoles = newRoles.filter(r => r !== roleToToggle)
    
    // If removing all non-user roles, user role will be added automatically
    if (newRoles.length === 0 || (newRoles.length === 1 && newRoles[0] === 'user')) {
      if (!newRoles.includes('user')) {
        confirmMessage += '\n\nThis will automatically assign the "User" role as users must have at least one role.'
      }
    }
  } else {
    // Adding a role
    confirmMessage = `Are you sure you want to give ${userName} the "${roleName}" role?`
    
    // Special warning for giving super admin role to others
    if (isSuperAdminRole && !isModifyingOwnRole) {
      confirmMessage = `⚠️ WARNING: You are about to grant Super Admin privileges!\n\nAre you sure you want to give ${userName} the "${roleName}" role?\n\nThis will allow them to:\n• Manage all users and roles\n• Access all admin functions\n• Remove or modify your Super Admin role\n\nOnly grant this role to trusted administrators.`
    }
    
    // If adding any role to a user who only has 'user' role, remove 'user' role
    if (currentRoles.includes('user') && roleToToggle !== 'user') {
      newRoles = newRoles.filter(r => r !== 'user')
      if (!confirmMessage.includes('automatically remove')) {
        confirmMessage += '\n\nThis will automatically remove the "User" role since users cannot have both User and other roles.'
      }
    }
    
    newRoles.push(roleToToggle)
  }
  
  // Ensure business rules are followed
  newRoles = applyRoleBusinessRules(newRoles)
  
  if (confirm(confirmMessage)) {
    await updateUserRoles(user, newRoles)
  }
  
  roleDropdownOpen.value = null
}

const applyRoleBusinessRules = (roles: UserRole[]): UserRole[] => {
  let newRoles = [...roles]
  
  // Rule 1: If 'user' role exists with other roles, remove 'user'
  if (newRoles.includes('user') && newRoles.length > 1) {
    newRoles = newRoles.filter(r => r !== 'user')
  }
  
  // Rule 2: If no roles remain, add 'user' role
  if (newRoles.length === 0) {
    newRoles = ['user']
  }
  
  return newRoles
}

const updateUserRoles = async (user: User, newRoles: UserRole[]) => {
  try {
    console.log('Updating user roles in database...', { userId: user.id, newRoles })
    
    const { error } = await authStore.updateUserRoles(user.id, newRoles)
    if (error) throw error

    showToast(`User roles updated successfully`, 'success')
    
    // Reload users to show the updated roles
    await loadUsers()
  } catch (error: any) {
    console.error('User role update failed:', error)
    showToast(`Failed to update user roles: ${error.message}`, 'error')
  }
}

const toggleUserRole = async (user: User, roleToToggle: UserRole) => {
  // This function is kept for backward compatibility but redirects to new handler
  await handleRoleToggle(user, roleToToggle)
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
    
    // Update user roles using auth store
    const { error: roleError } = await authStore.updateUserRoles(editingUser.value.id, editingUser.value.roles)
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
      
      // First delete from users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (error) {
        console.error('User deletion failed:', error)
        throw error
      }

      // Note: We're not deleting from auth.users as that requires special admin privileges
      // The user will still exist in auth but won't be able to use the app without a profile
      
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
  newUser.value = { name: '', username: '', email: '', password: '', roles: [], phone: '', bio: '', skip_email_verification: false }
}

const closeEditUser = () => {
  showEditUser.value = false
  editingUser.value = null
}

const syncAuthUsers = async () => {
  syncingUsers.value = true
  try {
    console.log('Syncing auth users to database...')
    
    // Get all auth users from Supabase Admin API
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      throw authError
    }
    
    console.log(`Found ${authUsers.users.length} auth users`)
    
    let syncedCount = 0
    let skippedCount = 0
    
    for (const authUser of authUsers.users) {
      try {
        // Check if user already exists in database
        const { data: existingUser, error: checkError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', authUser.id)
          .single()
        
        if (existingUser) {
          skippedCount++
          continue // User already exists in database
        }
        
        // Create user record in database with only required fields
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || `auth_user_${authUser.id.slice(0, 8)}@temp.com`,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || `User ${authUser.id.slice(0, 8)}`,
            role: 'user', // Use singular 'role' field with 'user' as default value
            is_active: true
          })
        
        if (insertError) {
          console.error(`Failed to sync user ${authUser.id}:`, insertError)
        } else {
          syncedCount++
          console.log(`Synced user ${authUser.email} to database`)
        }
      } catch (error) {
        console.error(`Error processing auth user ${authUser.id}:`, error)
      }
    }
    
    showToast(`Sync complete: ${syncedCount} users added, ${skippedCount} already existed`, 'success')
    
    // Reload users to show the synced users
    await loadUsers()
  } catch (error: any) {
    console.error('Auth sync failed:', error)
    showToast(`Failed to sync auth users: ${error.message}`, 'error')
  } finally {
    syncingUsers.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getLastActive = (user: User) => {
  // Mock last active time
  const lastActive = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7)
  return lastActive.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
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

// Check if current user can modify a specific role for another user
const canModifyRole = (user: User, role: UserRole) => {
  const currentUserRoles = authStore.profile?.roles || []
  const currentUserIsSuperAdmin = currentUserRoles.includes('super_admin')
  const currentUserIsAdmin = currentUserRoles.includes('admin')
  const isModifyingOwnRole = user.id === authStore.user?.id
  const hasRole = user.roles?.includes(role) || false
  
  const targetUserIsSuperAdmin = user.roles?.includes('super_admin') || false
  const targetUserIsAdmin = user.roles?.includes('admin') || false
  
  // Rule 1: Only Super Admins can modify Super Admin roles (including their own)
  if (role === 'super_admin') {
    return currentUserIsSuperAdmin && authStore.canAssignRole(role)
  }
  
  // Rule 2: Only Super Admins can modify roles of users who have Super Admin role
  if (targetUserIsSuperAdmin) {
    return currentUserIsSuperAdmin
  }
  
  // Rule 3: Only Super Admins can assign/remove Admin roles
  if (role === 'admin') {
    return currentUserIsSuperAdmin && authStore.canAssignRole(role)
  }
  
  // Rule 4: Only Super Admins can modify roles of users who have Admin role
  if (targetUserIsAdmin && !targetUserIsSuperAdmin) {
    return currentUserIsSuperAdmin
  }
  
  // Rule 5: Regular Admins can modify User and Counselor roles for non-admin users
  if ((role === 'user' || role === 'counselor') && !targetUserIsAdmin && !targetUserIsSuperAdmin) {
    if (currentUserIsSuperAdmin || currentUserIsAdmin) {
      if (hasRole) {
        return authStore.canRemoveRole(role)
      } else {
        return authStore.canAssignRole(role)
      }
    }
  }
  
  // Rule 6: Super Admins can modify their own roles (with warnings)
  if (isModifyingOwnRole && currentUserIsSuperAdmin) {
    if (hasRole) {
      return authStore.canRemoveRole(role)
    } else {
      return authStore.canAssignRole(role)
    }
  }
  
  // Rule 7: Non-super admins cannot modify their own roles
  if (isModifyingOwnRole && !currentUserIsSuperAdmin) {
    return false
  }
  
  // Default: deny access
  return false
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.header h1 {
  color: #B91C1C;
  margin: 0;
}

.header p {
  color: #666;
  margin: 0;
}



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

.stat-icon.user { background: #3b82f6; }
.stat-icon.counselor { background: #10b981; }
.stat-icon.admin { background: #B91C1C; }
.stat-icon.active { background: #8b5cf6; }

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
  padding: 0.5rem;
  border: 1px solid #F8C9C9;
  border-radius: 4px;
}

.filters {
  display: flex;
  gap: 1rem;
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 1200px;
}

.users-table th {
  background: #F8C9C9;
  padding: 1.5rem;
  text-align: left;
  font-weight: 600;
  color: #B91C1C;
  font-size: 0.95rem;
  letter-spacing: 0.025em;
}

.users-table td {
  padding: 1.75rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
  line-height: 1.6;
}

.checkbox-col {
  width: 50px;
  min-width: 50px;
}

.user-cell {
  min-width: 280px;
  width: 28%;
}

.user-info {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
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
  margin-top: 0.125rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.375rem;
  font-size: 1rem;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.user-id {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-all;
}

.email-cell {
  min-width: 240px;
  width: 22%;
}

.email {
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-all;
}

.role-cell {
  min-width: 180px;
  width: 16%;
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

.role-indicator.user {
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

.role-badge.user {
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

.checkbox-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label.disabled input {
  cursor: not-allowed;
}

.checkbox-label .fas.fa-lock {
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
  min-width: 100px;
  width: 8%;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.action-btn.edit {
  color: #B91C1C;
}

.action-btn.edit:hover {
  color: #991b1b;
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
}

.action-btn.info:hover {
  color: #1d4ed8;
}

.mobile-action-btn.reset {
  background: #3b82f6;
  color: white;
}

.mobile-action-btn.reset:hover {
  background: #1d4ed8;
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
}

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  margin: 1rem;
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

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #666;
  margin-bottom: 0;
}

.checkbox-label input[type="checkbox"] {
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

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.pagination-info {
  font-size: 0.9rem;
  color: #666;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover {
  background: #f5f5f5;
}

.page-btn.active {
  background: #B91C1C;
  color: white;
  border-color: #B91C1C;
}

/* Mobile Responsive Styles */
@media screen and (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .filters select {
    flex: 1;
    min-width: 120px;
  }
}

@media screen and (max-width: 768px) {
  .user-management {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    text-align: center;
  }
  
  .header-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }
  
  .header-actions .btn {
    flex: 1;
    min-width: 0;
    padding: 0.75rem;
    font-size: 0.9rem;
  }
  
  .header-actions .btn span {
    display: none;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  
  .stat-card {
    padding: 1rem;
    gap: 0.75rem;
  }
  
  .stat-icon {
    width: 35px;
    height: 35px;
  }
  
  .stat-content h3 {
    font-size: 1.25rem;
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
  
  /* Hide desktop table on mobile */
  .users-table {
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
  .user-management {
    padding: 0.75rem;
  }
  
  .header h1 {
    font-size: 1.25rem;
  }
  
  .header p {
    font-size: 0.9rem;
  }
  
  .header-actions {
    flex-direction: column;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 0.75rem;
  }
  
  .stat-icon {
    width: 30px;
    height: 30px;
  }
  
  .stat-content h3 {
    font-size: 1.1rem;
  }
  
  .stat-content p {
    font-size: 0.9rem;
  }
  
  .filters-section {
    padding: 0.75rem;
  }
  
  .bulk-buttons {
    flex-direction: column;
  }
  
  .modal {
    margin: 0.25rem;
    max-height: calc(100vh - 0.5rem);
  }
  
  .modal-header,
  .modal-body {
    padding: 0.75rem;
  }
  
  .toast {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    text-align: center;
  }
  
  /* Mobile card improvements for small screens */
  .mobile-user-card {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .mobile-user-header {
    margin-bottom: 0.75rem;
  }
  
  .mobile-user-details {
    padding: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .mobile-action-btn {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
    min-width: 70px;
  }
  
  .mobile-action-btn span {
    display: none;
  }
  
  /* Mobile pagination */
  .pagination {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  .pagination-info {
    text-align: center;
    font-size: 0.8rem;
  }
  
  .pagination-controls {
    justify-content: center;
  }
  
  .page-numbers {
    gap: 0.125rem;
  }
  
  .page-btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    min-width: 36px;
    min-height: 36px;
  }
  
  .pagination-btn {
    min-width: 36px;
    min-height: 36px;
  }
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
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid #f0f0f0;
  }
  
  .mobile-user-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .mobile-user-header input[type="checkbox"] {
    margin: 0;
    margin-top: 0.25rem;
    flex-shrink: 0;
  }
  
  .user-avatar {
    flex-shrink: 0;
  }
  
  .mobile-user-info {
    flex: 1;
    min-width: 0;
  }
  
  .mobile-user-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
    word-break: break-word;
    font-size: 1rem;
  }
  
  .mobile-user-email {
    font-size: 0.85rem;
    color: #666;
    word-break: break-all;
  }
  
  .mobile-user-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
    background: #f9f9f9;
    padding: 0.75rem;
    border-radius: 6px;
  }
  
  .mobile-detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .mobile-detail-label {
    font-size: 0.75rem;
    color: #666;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .mobile-detail-value {
    font-size: 0.9rem;
    color: #333;
  }
  
  .mobile-user-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .mobile-action-btn {
    flex: 1;
    min-width: 80px;
    padding: 0.6rem 0.5rem;
    border-radius: 6px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    font-weight: 500;
    transition: all 0.2s ease;
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
</style> 
