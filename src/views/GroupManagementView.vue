<template>
  <div class="support-groups-view" :class="viewClasses">
    <!-- Create Button in Top Right -->
    <div class="top-actions">
      <button @click="showCreateGroupModal = true" class="btn primary">
        <i class="fas fa-plus"></i>
        <span>Create Support Group</span>
      </button>
    </div>

    <!-- Support Groups Management Tabs -->
    <div class="management-tabs">
      <div class="tabs">
        <button 
          :class="{ active: activeTab === 'all' }" 
          @click="activeTab = 'all'"
          class="tab-btn"
        >
          <i class="fas fa-heart-pulse"></i>
          All Groups ({{ supportGroups.length }})
        </button>
        <button 
          :class="{ active: activeTab === 'public' }" 
          @click="activeTab = 'public'"
          class="tab-btn"
        >
          <i class="fas fa-globe"></i>
          Public Groups ({{ supportGroups.filter(g => !g.is_private).length }})
        </button>
        <button 
          :class="{ active: activeTab === 'private' }" 
          @click="activeTab = 'private'"
          class="tab-btn"
        >
          <i class="fas fa-lock"></i>
          Private Groups ({{ supportGroups.filter(g => g.is_private).length }})
        </button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search support groups..."
        >
      </div>
      
      <div class="filters mobile-stack">
        <select v-model="typeFilter" @change="applyFilters" class="filter-select">
          <option value="">All Types</option>
          <option value="pre_abortion">Pre-Abortion Support</option>
          <option value="post_abortion">Post-Abortion Care</option>
          <option value="crisis">Crisis Support</option>
          <option value="ongoing">Ongoing Support</option>
        </select>
        
        <select v-model="sortBy" @change="applyFilters" class="filter-select">
          <option value="created_at">Newest First</option>
          <option value="name">Name A-Z</option>
          <option value="member_count">Most Members</option>
          <option value="last_activity">Most Active</option>
        </select>

        <button @click="clearFilters" class="clear-filters-btn btn-mobile">
          <i class="fas fa-times"></i>
          <span>Clear</span>
        </button>
      </div>
    </div>

    <!-- Groups Content -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading support groups...</p>
    </div>

    <div v-else-if="supportGroups.length === 0" class="empty-state">
      <i class="fas fa-heart-pulse"></i>
      <h3>No Support Groups Found</h3>
      <p>No abortion care support groups have been created yet. Create your first support group to help people in need.</p>
      <button @click="showCreateGroupModal = true" class="btn primary" style="margin-top: 1rem;">
        <i class="fas fa-plus"></i>
        Create First Support Group
      </button>
    </div>

    <div v-else class="groups-content">
      <!-- Support Groups Grid -->
      <div class="support-groups-grid">
        <div 
          v-for="group in paginatedGroups" 
          :key="group.id" 
          class="support-group-card"
        >
          <div class="group-header">
            <h4>{{ group.name }}</h4>
            <span class="group-type-badge">{{ group.category?.replace('_', ' ') || 'Support' }}</span>
          </div>
          <p class="group-description">{{ truncateText(group.description, 120) }}</p>
          <div class="group-meta">
            <div class="meta-item">
              <i class="fas fa-users"></i>
              <span>{{ group.member_count || 0 }} members</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-calendar"></i>
              <span>{{ formatDate(group.created_at) }}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-clipboard-list"></i>
              <span>{{ getGroupJoinRequests(group.id).length }} join requests</span>
            </div>
            <div v-if="group.requires_approval" class="meta-item">
              <i class="fas fa-check-circle"></i>
              <span>Approval Required</span>
            </div>
            <div v-if="group.is_member" class="meta-item member-badge">
              <i class="fas fa-check-circle"></i>
              <span>Member</span>
            </div>
          </div>
          <div class="group-actions">
            <div class="action-buttons">
              <button @click="openGroupChat(group)" class="chat-btn">
                <i class="fas fa-comments"></i>
                Open Chat
              </button>
              <button @click="manageGroup(group)" class="manage-btn">
                <i class="fas fa-cog"></i>
                Manage
              </button>
            </div>
          </div>
          <div class="group-footer">
            <div class="activity-indicator" :class="getActivityClass(group)">
              <i class="fas fa-circle"></i>
              {{ getActivityText(group) }}
            </div>
            <span class="last-activity">
              {{ getLastActivityText(group) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <div class="pagination-info">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredGroups.length) }} of {{ filteredGroups.length }} support groups
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

    <!-- Create Group Modal -->
    <div v-if="showCreateGroupModal" class="modal-overlay" @click="closeCreateGroupModal">
      <div class="modal-content create-group-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingGroup ? 'Edit Support Group' : 'Create New Support Group' }}</h3>
          <button @click="closeCreateGroupModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="create-group-content">
          <form @submit.prevent="saveGroup" class="group-form">
            <div class="form-section">
              <h4>Basic Information</h4>
              
              <div class="form-group">
                <label for="group-name">Group Name *</label>
                <input 
                  id="group-name"
                  v-model="groupForm.name" 
                  type="text" 
                  required
                  placeholder="Enter group name"
                  class="form-input"
                >
              </div>
              
              <div class="form-group">
                <label for="group-description">Description</label>
                <textarea 
                  id="group-description"
                  v-model="groupForm.description" 
                  placeholder="Describe the group purpose and how it helps users"
                  rows="4"
                  class="form-textarea"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label>Who can See this Group</label>
                <div class="visibility-checkboxes">
                  <div class="visibility-row">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="groupForm.visible_to_users">
                      <span class="checkmark"></span>
                      <div class="role-info">
                        <strong>Users</strong>
                        <small>Regular users and clients can see this group</small>
                      </div>
                    </label>
                  </div>
                  
                  <div class="visibility-row">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="groupForm.visible_to_counselors">
                      <span class="checkmark"></span>
                      <div class="role-info">
                        <strong>Counselors</strong>
                        <small>Licensed counselors can see this group</small>
                      </div>
                    </label>
                  </div>
                  
                  <div class="visibility-row">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="groupForm.visible_to_admins">
                      <span class="checkmark"></span>
                      <div class="role-info">
                        <strong>Admins</strong>
                        <small>System administrators can see this group</small>
                      </div>
                    </label>
                  </div>
                  
                  <div class="visibility-row">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="groupForm.visible_to_super_admins">
                      <span class="checkmark"></span>
                      <div class="role-info">
                        <strong>Super Admins</strong>
                        <small>Super administrators can see this group</small>
                      </div>
                    </label>
                  </div>
                </div>
                <small class="form-help">Select which user roles can discover and join this support group. At least one role must be selected.</small>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="groupForm.requires_approval" @change="onRequireApprovalChange">
                    <span class="checkmark"></span>
                    Require Approval
                  </label>
                  <small>New members must be approved before joining</small>
                </div>
              </div>
            </div>

            <!-- Questionnaire Section (shown when approval is required) -->
            <div v-if="groupForm.requires_approval" class="form-section questionnaire-section">
              <h4>Membership Questionnaire</h4>
              <p class="section-description">Create questions that users must answer when requesting to join this group</p>
              
              <div class="questionnaire-builder">
                <div v-for="(question, index) in groupForm.questionnaire" :key="index" class="question-item">
                  <div class="question-header">
                    <span class="question-number">{{ index + 1 }}.</span>
                    <button @click="removeQuestion(index)" class="remove-question-btn" type="button">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div class="question-fields">
                    <div class="form-group">
                      <label>Question *</label>
                      <input 
                        v-model="question.question" 
                        type="text" 
                        placeholder="Enter your question"
                        class="form-input"
                        required
                      >
                    </div>
                    
                    <div class="form-group">
                      <label>Question Type</label>
                      <select v-model="question.type" class="form-select">
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="yes_no">Yes/No</option>
                      </select>
                    </div>
                    
                    <!-- Multiple choice options -->
                    <div v-if="question.type === 'multiple_choice'" class="form-group">
                      <label>Options</label>
                      <div class="options-list">
                        <div v-for="(option, optionIndex) in (question.options || [])" :key="optionIndex" class="option-item">
                          <input 
                            v-model="question.options![optionIndex]" 
                            type="text" 
                            placeholder="Option text"
                            class="form-input"
                          >
                          <button @click="removeOption(index, optionIndex)" class="remove-option-btn" type="button">
                            <i class="fas fa-times"></i>
                          </button>
                        </div>
                        <button @click="addOption(index)" class="add-option-btn" type="button">
                          <i class="fas fa-plus"></i>
                          Add Option
                        </button>
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label class="checkbox-label">
                        <input type="checkbox" v-model="question.required">
                        <span class="checkmark"></span>
                        Required Question
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="add-question-section">
                  <button @click="addQuestion" class="add-question-btn" type="button">
                    <i class="fas fa-plus"></i>
                    Add Question
                  </button>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeCreateGroupModal" class="btn secondary">
                Cancel
              </button>
              <button type="submit" :disabled="!groupForm.name || savingGroup" class="btn primary">
                <i v-if="savingGroup" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{ savingGroup ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Support Group') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Group Management Modal -->
    <div v-if="showGroupManageModal" class="modal-overlay" @click="closeGroupManageModal">
      <div class="modal-content group-manage-modal enhanced-modal" @click.stop>
        <div class="modal-header">
          <h3>Manage {{ selectedGroupForManagement?.name }}</h3>
          <button @click="closeGroupManageModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-tabs">
          <button 
            :class="{ active: activeManageTab === 'overview' }" 
            @click="activeManageTab = 'overview'"
            class="tab-btn"
          >
            <i class="fas fa-chart-line"></i>
            <span>Overview</span>
          </button>
          <button 
            :class="{ active: activeManageTab === 'edit' }" 
            @click="activeManageTab = 'edit'"
            class="tab-btn"
          >
            <i class="fas fa-edit"></i>
            <span>Edit Group</span>
          </button>
          <button 
            :class="{ active: activeManageTab === 'members' }" 
            @click="activeManageTab = 'members'"
            class="tab-btn"
          >
            <i class="fas fa-users"></i>
            <span>Members ({{ groupMembers.length }})</span>
          </button>
          <button 
            :class="{ active: activeManageTab === 'requests' }" 
            @click="activeManageTab = 'requests'"
            class="tab-btn"
          >
            <i class="fas fa-clipboard-list"></i>
            <span>Requests ({{ getGroupJoinRequests(selectedGroupForManagement?.id || '').length }})</span>
          </button>
          <button 
            :class="{ active: activeManageTab === 'chat' }" 
            @click="activeManageTab = 'chat'"
            class="tab-btn"
          >
            <i class="fas fa-comments"></i>
            <span>Group Chat</span>
          </button>
        </div>
        
        <div class="group-manage-content">
          <!-- Overview Tab -->
          <div v-if="activeManageTab === 'overview'" class="manage-section">
            <div class="group-overview-stats">
              <div class="overview-stat">
                <i class="fas fa-users"></i>
                <span>{{ selectedGroupForManagement?.member_count || 0 }} Members</span>
              </div>
              <div class="overview-stat">
                <i class="fas fa-clipboard-list"></i>
                <span>{{ getGroupJoinRequests(selectedGroupForManagement?.id || '').length }} Join Requests</span>
              </div>
              <div class="overview-stat">
                <i class="fas fa-calendar"></i>
                <span>Created {{ formatDate(selectedGroupForManagement?.created_at || '') }}</span>
              </div>
              <div class="overview-stat">
                <i class="fas fa-eye"></i>
                <span>{{ selectedGroupForManagement?.is_private ? 'Private' : 'Public' }}</span>
              </div>
            </div>

            <div class="group-actions-grid">
              <button @click="toggleGroupStatus(selectedGroupForManagement)" class="action-btn" :class="getStatusActionClass(selectedGroupForManagement)">
                <i class="fas" :class="getStatusActionIcon(selectedGroupForManagement)"></i>
                <span>{{ getStatusActionTitle(selectedGroupForManagement) }}</span>
              </button>
            </div>
          </div>

          <!-- Edit Group Tab -->
          <div v-if="activeManageTab === 'edit'" class="manage-section">
            <form @submit.prevent="updateGroup" class="group-edit-form">
              <div class="form-section">
                <h4>Basic Information</h4>
                
                <div class="form-group">
                  <label for="edit-group-name">Group Name *</label>
                  <input 
                    id="edit-group-name"
                    v-model="editForm.name" 
                    type="text" 
                    required
                    class="form-input"
                  >
                </div>
                
                <div class="form-group">
                  <label for="edit-group-description">Description</label>
                  <textarea 
                    id="edit-group-description"
                    v-model="editForm.description" 
                    rows="4"
                    class="form-textarea"
                  ></textarea>
                </div>
                
                <div class="form-group">
                  <label>Who can See this Group</label>
                  <div class="visibility-checkboxes">
                    <div class="visibility-row">
                      <label class="checkbox-label">
                        <input type="checkbox" v-model="editForm.visible_to_users">
                        <span class="checkmark"></span>
                        <div class="role-info">
                          <strong>Users</strong>
                          <small>Regular users and clients can see this group</small>
                        </div>
                      </label>
                    </div>
                    
                    <div class="visibility-row">
                      <label class="checkbox-label">
                        <input type="checkbox" v-model="editForm.visible_to_counselors">
                        <span class="checkmark"></span>
                        <div class="role-info">
                          <strong>Counselors</strong>
                          <small>Licensed counselors can see this group</small>
                        </div>
                      </label>
                    </div>
                    
                    <div class="visibility-row">
                      <label class="checkbox-label">
                        <input type="checkbox" v-model="editForm.visible_to_admins">
                        <span class="checkmark"></span>
                        <div class="role-info">
                          <strong>Admins</strong>
                          <small>System administrators can see this group</small>
                        </div>
                      </label>
                    </div>
                    
                    <div class="visibility-row">
                      <label class="checkbox-label">
                        <input type="checkbox" v-model="editForm.visible_to_super_admins">
                        <span class="checkmark"></span>
                        <div class="role-info">
                          <strong>Super Admins</strong>
                          <small>Super administrators can see this group</small>
                        </div>
                      </label>
                    </div>
                  </div>
                  <small class="form-help">Select which user roles can discover and join this support group. At least one role must be selected.</small>
                </div>
                
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="editForm.requires_approval">
                    <span class="checkmark"></span>
                    Require Approval to Join
                  </label>
                  <small class="form-help">When enabled, users must request to join and be approved by an administrator</small>
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" :disabled="savingGroup" class="btn primary">
                  <i v-if="savingGroup" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-save"></i>
                  {{ savingGroup ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Members Tab -->
          <div v-if="activeManageTab === 'members'" class="manage-section">
            <div class="members-header">
              <h4>Group Members</h4>
              <div class="members-search">
                <input 
                  v-model="memberSearchQuery" 
                  type="text" 
                  placeholder="Search members..."
                  class="form-input"
                >
              </div>
            </div>
            
            <div v-if="loadingMembers" class="loading-state">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading members...</p>
            </div>
            
            <div v-else-if="groupMembers.length === 0" class="empty-state">
              <i class="fas fa-users"></i>
              <p>No members in this group yet</p>
            </div>
            
            <div v-else class="members-list">
              <div v-for="member in filteredMembers" :key="member.id" class="member-item">
                <div class="member-info">
                  <div class="member-avatar">
                    <img 
                      v-if="member.user?.avatar"
                      :src="member.user.avatar" 
                      :alt="member.user?.name || 'User'"
                    />
                    <div v-else class="default-avatar">
                      {{ (member.user?.name || 'U').charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <div class="member-details">
                    <h5>{{ member.user?.name || 'Unknown User' }}</h5>
                    <p>{{ member.user?.email || 'No email' }}</p>
                    <div class="member-meta">
                      <span class="member-role" :class="member.role">{{ member.role }}</span>
                      <span class="member-joined">Joined {{ formatDate(member.joined_at) }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="member-actions">
                  <div class="action-dropdown">
                    <button @click="toggleMemberActions(member.id)" class="action-toggle-btn">
                      <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div v-if="activeMemberActions === member.id" class="action-menu">
                      <button @click="removeMemberFromGroup(member)" class="action-item remove">
                        <i class="fas fa-user-minus"></i>
                        Remove from Group
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Join Requests Tab -->
          <div v-if="activeManageTab === 'requests'" class="manage-section">
            <h4>Join Requests</h4>
            <div v-if="getGroupJoinRequests(selectedGroupForManagement?.id || '').length === 0" class="empty-state">
              <i class="fas fa-clipboard-list"></i>
              <p>No pending join requests for this group</p>
            </div>
            <div v-else class="requests-list">
              <div v-for="request in getGroupJoinRequests(selectedGroupForManagement?.id || '')" :key="request.id" class="request-item">
                <div class="request-info">
                  <div class="user-details">
                    <h5>{{ request.user?.name || 'Anonymous User' }}</h5>
                    <p>{{ request.user?.email || 'No email provided' }}</p>
                    <span class="request-date">{{ formatDate(request.created_at) }}</span>
                  </div>
                  <div v-if="(request as any).reason" class="request-reason">
                    <strong>Reason:</strong> {{ (request as any).reason }}
                  </div>
                  <div v-if="request.questionnaire_answers && request.questionnaire_answers.length > 0" class="questionnaire-answers">
                    <strong>Questionnaire Responses:</strong>
                    <div class="answers-list">
                      <div v-for="(answer, index) in request.questionnaire_answers" :key="index" class="answer-item">
                        <span class="question">{{ answer.question }}:</span>
                        <span class="answer">{{ Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="request-actions">
                  <button @click="approveRequest(request)" class="btn success">
                    <i class="fas fa-check"></i>
                    Approve
                  </button>
                  <button @click="rejectRequest(request)" class="btn danger">
                    <i class="fas fa-times"></i>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Group Chat Tab -->
          <div v-if="activeManageTab === 'chat'" class="manage-section">
            <div class="chat-section">
              <div class="chat-header">
                <h4>Group Chat Access</h4>
                <p class="chat-description">Access the live group chat to monitor conversations and moderate if needed.</p>
              </div>
              
              <div class="chat-actions">
                <button @click="selectedGroupForManagement && openGroupChat(selectedGroupForManagement)" class="btn primary chat-access-btn">
                  <i class="fas fa-external-link-alt"></i>
                  Open Group Chat in New Tab
                </button>
                
                <div class="chat-info">
                  <div class="info-item">
                    <i class="fas fa-users"></i>
                    <span>{{ selectedGroupForManagement?.member_count || 0 }} active members</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-comments"></i>
                    <span>Real-time messaging enabled</span>
                  </div>
                  <div class="info-item">
                    <i class="fas fa-shield-alt"></i>
                    <span>{{ selectedGroupForManagement?.is_confidential ? 'Confidential' : 'Public' }} conversations</span>
                  </div>
                </div>
                
                <div class="chat-guidelines">
                  <h5>Moderation Guidelines</h5>
                  <ul>
                    <li>Monitor for inappropriate content and behavior</li>
                    <li>Ensure conversations remain supportive and respectful</li>
                    <li>Intervene only when necessary to maintain group safety</li>
                    <li>Respect member privacy and confidentiality</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Toast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="closeToast"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Toast from '@/components/Toast.vue'
import { supportGroupsService, type SupportGroup, type CreateSupportGroupData, type JoinRequest } from '@/services/supportGroupsService'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success')

// User role for admin functions
const userRole = computed(() => {
  const role = authStore.profile?.role || 'admin'
  console.log('User role computed:', role, 'from profile:', authStore.profile)
  return role
})

// Support groups
const supportGroups = ref<SupportGroup[]>([])

// Search and filtering
const searchQuery = ref('')
const typeFilter = ref('')
const sortBy = ref('created_at')
const currentPage = ref(1)

// Responsive layout state
const isMobile = ref(window.innerWidth <= 1023)
const isMainSidebarCollapsed = ref(false)

// Computed for view classes
const viewClasses = computed(() => ({
  'sidebar-collapsed': isMainSidebarCollapsed.value && !isMobile.value
}))

// Detect sidebar state
const checkMainSidebarState = () => {
  const adminSidebar = document.querySelector('.sidebar')
  if (adminSidebar) {
    isMainSidebarCollapsed.value = adminSidebar.classList.contains('collapsed')
  }
}

// Handle window resize
const handleResize = () => {
  isMobile.value = window.innerWidth <= 1023
}
const itemsPerPage = ref(12)

// Group creation and management
const showCreateGroupModal = ref(false)
const showGroupManageModal = ref(false)
const selectedGroupForManagement = ref<SupportGroup | null>(null)
const editingGroup = ref<SupportGroup | null>(null)
const savingGroup = ref(false)
const activeManageTab = ref<'overview' | 'edit' | 'members' | 'requests' | 'chat'>('overview')
const loadingMembers = ref(false)
const memberSearchQuery = ref('')
const activeMemberActions = ref<string | null>(null)
const groupMembers = ref<any[]>([])
const groupJoinRequests = ref<Record<string, JoinRequest[]>>({})

// Add missing reactive variables
const activeTab = ref<'all' | 'public' | 'private'>('all')

// Question type for questionnaire
interface QuestionnaireQuestion {
  question: string
  type: 'text' | 'textarea' | 'multiple_choice' | 'yes_no'
  options?: string[]
  required: boolean
}

// Group form data
const groupForm = ref<CreateSupportGroupData & { 
  questionnaire: QuestionnaireQuestion[]
  visible_to_users: boolean
  visible_to_counselors: boolean
  visible_to_admins: boolean
  visible_to_super_admins: boolean
}>({
  name: '',
  description: '',
  category: 'pre_abortion',
  type: 'peer_support',
  is_private: false,
  is_confidential: true,
  requires_approval: true,
  max_members: 15,
  meeting_type: 'in_person',
  meeting_schedule: '',
  meeting_link: '',
  meeting_location: '',
  time_zone: '',
  country: '',
  region: '',
  city: '',
  language: 'en',
  moderators: [],
  questionnaire: [],
  visible_to_users: true,
  visible_to_counselors: true,
  visible_to_admins: true,
  visible_to_super_admins: true
})

// Edit form data
const editForm = ref<any>({
  name: '',
  description: '',
  is_private: false,
  is_confidential: true,
  requires_approval: false,
  visible_to_users: true,
  visible_to_counselors: true,
  visible_to_admins: true,
  visible_to_super_admins: true
})

// Local storage key for membership cache
const getMembershipCacheKey = () => `support_group_memberships_${authStore.user?.id || 'anonymous'}`

// Save membership status to localStorage for persistence
const saveMembershipToCache = (groupId: string, isMember: boolean) => {
  if (!authStore.user?.id) return
  
  try {
    const cacheKey = getMembershipCacheKey()
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')
    cached[groupId] = {
      is_member: isMember,
      updated_at: new Date().toISOString()
    }
    localStorage.setItem(cacheKey, JSON.stringify(cached))
    console.log('Saved membership to cache:', { groupId, isMember })
  } catch (error) {
    console.error('Error saving membership to cache:', error)
  }
}

// Load membership status from localStorage cache
const loadMembershipFromCache = () => {
  if (!authStore.user?.id) return {}
  
  try {
    const cacheKey = getMembershipCacheKey()
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')
    console.log('Loaded membership from cache:', cached)
    return cached
  } catch (error) {
    console.error('Error loading membership from cache:', error)
    return {}
  }
}

// Clear old cache entries (older than 1 hour)
const cleanupMembershipCache = () => {
  try {
    const cacheKey = getMembershipCacheKey()
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const cleaned = Object.fromEntries(
      Object.entries(cached).filter(([_, data]: [string, any]) => 
        data.updated_at && data.updated_at > oneHourAgo
      )
    )
    
    localStorage.setItem(cacheKey, JSON.stringify(cleaned))
  } catch (error) {
    console.error('Error cleaning up membership cache:', error)
  }
}

// Computed properties
const filteredGroups = computed(() => {
  let result = supportGroups.value

  // Filter by tab
  if (activeTab.value === 'public') {
    result = result.filter(group => !group.is_private)
  } else if (activeTab.value === 'private') {
    result = result.filter(group => group.is_private)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(group => 
      group.name.toLowerCase().includes(query) ||
      (group.description && group.description.toLowerCase().includes(query))
    )
  }

  if (typeFilter.value) {
    result = result.filter(group => group.type === typeFilter.value)
  }

  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'member_count':
        return (b.member_count || 0) - (a.member_count || 0)
      case 'last_activity':
        const aActivity = new Date(a.last_activity || a.created_at).getTime()
        const bActivity = new Date(b.last_activity || b.created_at).getTime()
        return bActivity - aActivity
      case 'created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredGroups.value.length / itemsPerPage.value))

const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredGroups.value.slice(start, end)
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

const filteredMembers = computed(() => {
  if (!memberSearchQuery.value) return groupMembers.value
  
  const query = memberSearchQuery.value.toLowerCase()
  return groupMembers.value.filter(member =>
    member.user?.name?.toLowerCase().includes(query) ||
    member.user?.email?.toLowerCase().includes(query)
  )
})



// Helper methods
const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: string } = {
    'legal': 'fas fa-balance-scale',
    'financial': 'fas fa-dollar-sign',
    'medical': 'fas fa-stethoscope',
    'emotional': 'fas fa-heart',
    'safety': 'fas fa-shield-alt',
    'educational': 'fas fa-graduation-cap'
  }
  return icons[category.toLowerCase()] || 'fas fa-file-alt'
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

const getStatusActionClass = (group: any) => {
  switch (group?.status) {
    case 'pending': return 'success'
    case 'active': return 'warning'
    default: return 'secondary'
  }
}

const getStatusActionIcon = (group: any) => {
  switch (group?.status) {
    case 'pending': return 'fa-check'
    case 'active': return 'fa-pause'
    default: return 'fa-cog'
  }
}

const getStatusActionTitle = (group: any) => {
  switch (group?.status) {
    case 'pending': return 'Approve Group'
    case 'active': return 'Pause Group'
    default: return 'Manage Status'
  }
}

const getGroupJoinRequests = (groupId: string) => {
  return groupJoinRequests.value[groupId] || []
}

const getActivityClass = (group: SupportGroup) => {
  // Simple activity indicator logic
  const lastActivity = new Date(group.last_activity || group.created_at)
  const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysSinceActivity < 1) return 'active'
  if (daysSinceActivity < 7) return 'recent'
  return 'inactive'
}

const getActivityText = (group: SupportGroup) => {
  const activityClass = getActivityClass(group)
  switch (activityClass) {
    case 'active': return 'Active Today'
    case 'recent': return 'Active This Week'
    default: return 'Less Active'
  }
}

const getLastActivityText = (group: SupportGroup) => {
  const lastActivity = new Date(group.last_activity || group.created_at)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - lastActivity.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  return `${Math.ceil(diffDays / 30)} months ago`
}

// Main actions

const openGroupChat = (group: SupportGroup) => {
  console.log('🔄 Admin opening group chat:', {
    groupId: group.id,
    groupName: group.name,
    userRole: authStore.profile?.role,
    isAdmin: authStore.isAdmin,
    isSuperAdmin: authStore.isSuperAdmin
  })
  router.push(`/support-group/${group.id}/chat`)
}

const manageGroup = (group: SupportGroup) => {
  selectedGroupForManagement.value = group
  activeManageTab.value = 'overview'
  
  // Initialize edit form with group data
  editForm.value = {
    name: group.name || '',
    description: group.description || '',
    is_private: group.is_private ?? false,
    is_confidential: group.is_confidential ?? true,
    requires_approval: group.requires_approval ?? false,
    visible_to_users: group.visible_to_users ?? true,
    visible_to_counselors: group.visible_to_counselors ?? true,
    visible_to_admins: group.visible_to_admins ?? true,
    visible_to_super_admins: group.visible_to_super_admins ?? true
  }
  
  // Load group members
  loadGroupMembers(group.id)
  
  showGroupManageModal.value = true
}

// Group management actions
const toggleGroupStatus = async (group: any) => {
  if (!group) return
  
  try {
    const newStatus = group.status === 'pending' ? 'active' : 'pending'
    console.log(`Toggling group ${group.id} status from ${group.status} to ${newStatus}`)
    
    await supportGroupsService.toggleGroupStatus(group.id, newStatus)
    
    // Update local data
    const index = supportGroups.value.findIndex(g => g.id === group.id)
    if (index !== -1) {
      supportGroups.value[index] = { ...supportGroups.value[index], status: newStatus }
    }
    
    console.log('Group status updated successfully')
    showToastMessage(`Group ${newStatus === 'active' ? 'activated' : 'paused'} successfully`, 'success')
  } catch (error) {
    console.error('Error toggling group status:', error)
    showToastMessage(`Failed to update group status: ${(error as any)?.message || 'Unknown error'}`, 'error')
  }
}

const approveRequest = async (request: any) => {
  try {
    await supportGroupsService.approveJoinRequest(request.id, authStore.user?.id || 'admin')
    
    // Remove from pending requests
    if (groupJoinRequests.value[request.support_group_id]) {
      groupJoinRequests.value[request.support_group_id] = groupJoinRequests.value[request.support_group_id].filter(r => r.id !== request.id)
    }
    
    // Reload groups to update member counts
    await loadSupportGroups()
    showToastMessage('Join request approved successfully', 'success')
  } catch (error) {
    console.error('Error approving request:', error)
    showToastMessage('Failed to approve request', 'error')
  }
}

const rejectRequest = async (request: any) => {
  try {
    await supportGroupsService.rejectJoinRequest(request.id, authStore.user?.id || 'admin')
    
    // Remove from pending requests
    if (groupJoinRequests.value[request.support_group_id]) {
      groupJoinRequests.value[request.support_group_id] = groupJoinRequests.value[request.support_group_id].filter(r => r.id !== request.id)
    }
    
    showToastMessage('Join request rejected', 'success')
  } catch (error) {
    console.error('Error rejecting request:', error)
    showToastMessage('Failed to reject request', 'error')
  }
}

// Member management
const loadGroupMembers = async (groupId: string) => {
  loadingMembers.value = true
  try {
    const members = await supportGroupsService.getGroupMembers(groupId)
    groupMembers.value = members
  } catch (error) {
    console.error('Error loading group members:', error)
    groupMembers.value = []
  } finally {
    loadingMembers.value = false
  }
}

const toggleMemberActions = (memberId: string) => {
  activeMemberActions.value = activeMemberActions.value === memberId ? null : memberId
}

const removeMemberFromGroup = async (member: any) => {
  if (!selectedGroupForManagement.value) return
  
  if (!confirm(`Are you sure you want to remove ${member.user?.name} from this group?`)) return
  
  try {
    await supportGroupsService.removeMember(selectedGroupForManagement.value.id, member.user_id)
    
    // Remove from local state
    groupMembers.value = groupMembers.value.filter(m => m.id !== member.id)
    
    activeMemberActions.value = null
    showToastMessage('Member removed successfully', 'success')
  } catch (error) {
    console.error('Error removing member:', error)
    showToastMessage('Failed to remove member', 'error')
  }
}

const updateGroup = async () => {
  if (!selectedGroupForManagement.value) return
  
  savingGroup.value = true
  try {
    const updatedGroup = await supportGroupsService.updateSupportGroup(selectedGroupForManagement.value.id, {
      name: editForm.value.name,
      description: editForm.value.description,
      is_private: editForm.value.is_private,
      is_confidential: editForm.value.is_confidential,
      requires_approval: editForm.value.requires_approval,
      visible_to_users: editForm.value.visible_to_users,
      visible_to_counselors: editForm.value.visible_to_counselors,
      visible_to_admins: editForm.value.visible_to_admins,
      visible_to_super_admins: editForm.value.visible_to_super_admins
    })
    
    // Update local state
    const index = supportGroups.value.findIndex(g => g.id === selectedGroupForManagement.value!.id)
    if (index !== -1) {
      supportGroups.value[index] = updatedGroup
    }
    selectedGroupForManagement.value = updatedGroup
    
    showToastMessage('Group updated successfully!', 'success')
  } catch (error) {
    console.error('Error updating group:', error)
    showToastMessage('Failed to update group', 'error')
  } finally {
    savingGroup.value = false
  }
}

// Group creation methods
const resetGroupForm = () => {
  groupForm.value = {
    name: '',
    description: '',
    category: 'pre_abortion',
    type: 'peer_support',
    is_private: false,
    is_confidential: true,
    requires_approval: true,
    max_members: 15,
    meeting_type: 'in_person',
    meeting_schedule: '',
    meeting_link: '',
    meeting_location: '',
    time_zone: '',
    country: '',
    region: '',
    city: '',
    language: 'en',
    moderators: [],
    questionnaire: [],
    visible_to_users: true,
    visible_to_counselors: true,
    visible_to_admins: true,
    visible_to_super_admins: true
  }
}

const onRequireApprovalChange = () => {
  if (!groupForm.value.requires_approval) {
    groupForm.value.questionnaire = []
  }
}

const addQuestion = () => {
  groupForm.value.questionnaire.push({
    question: '',
    type: 'text',
    required: true,
    options: []
  })
}

const removeQuestion = (index: number) => {
  groupForm.value.questionnaire.splice(index, 1)
}

const addOption = (questionIndex: number) => {
  const question = groupForm.value.questionnaire[questionIndex]
  if (!question.options) {
    question.options = []
  }
  question.options.push('')
}

const removeOption = (questionIndex: number, optionIndex: number) => {
  const question = groupForm.value.questionnaire[questionIndex]
  if (question.options) {
    question.options.splice(optionIndex, 1)
  }
}

const closeCreateGroupModal = () => {
  showCreateGroupModal.value = false
  editingGroup.value = null
  resetGroupForm()
}

const closeGroupManageModal = () => {
  showGroupManageModal.value = false
  selectedGroupForManagement.value = null
}

const saveGroup = async () => {
  if (!groupForm.value.name.trim()) return
  
  savingGroup.value = true
  
  try {
    console.log('Saving group with data:', groupForm.value)
    
    if (editingGroup.value) {
      // Update existing group
      console.log('Updating existing group:', editingGroup.value.id)
      const updatedGroup = await supportGroupsService.updateSupportGroup(editingGroup.value.id, {
        name: groupForm.value.name.trim(),
        description: groupForm.value.description.trim(),
        category: groupForm.value.category,
        type: groupForm.value.type,
        is_private: groupForm.value.is_private,
        is_confidential: groupForm.value.is_confidential,
        requires_approval: groupForm.value.requires_approval,
        max_members: groupForm.value.max_members,
        meeting_type: groupForm.value.meeting_type,
        meeting_schedule: groupForm.value.meeting_schedule,
        meeting_link: groupForm.value.meeting_link,
        meeting_location: groupForm.value.meeting_location,
        time_zone: groupForm.value.time_zone,
        country: groupForm.value.country,
        region: groupForm.value.region,
        city: groupForm.value.city,
        language: groupForm.value.language,
        moderators: groupForm.value.moderators,
        questionnaire: groupForm.value.requires_approval ? groupForm.value.questionnaire : undefined
      })
      
      // Update local state
      const index = supportGroups.value.findIndex(g => g.id === editingGroup.value!.id)
      if (index !== -1) {
        supportGroups.value[index] = updatedGroup
      }
      
      console.log('Group updated successfully:', updatedGroup)
    } else {
      // Create new group
      console.log('Creating new group...')
      const newGroup = await supportGroupsService.createSupportGroup({
        name: groupForm.value.name.trim(),
        description: groupForm.value.description.trim(),
        category: groupForm.value.category,
        type: groupForm.value.type,
        is_private: groupForm.value.is_private,
        is_confidential: groupForm.value.is_confidential,
        requires_approval: groupForm.value.requires_approval,
        max_members: groupForm.value.max_members,
        meeting_type: groupForm.value.meeting_type,
        meeting_schedule: groupForm.value.meeting_schedule,
        meeting_link: groupForm.value.meeting_link,
        meeting_location: groupForm.value.meeting_location,
        time_zone: groupForm.value.time_zone,
        country: groupForm.value.country,
        region: groupForm.value.region,
        city: groupForm.value.city,
        language: groupForm.value.language,
        moderators: groupForm.value.moderators,
        questionnaire: groupForm.value.requires_approval ? groupForm.value.questionnaire : undefined,
        visible_to_users: groupForm.value.visible_to_users,
        visible_to_counselors: groupForm.value.visible_to_counselors,
        visible_to_admins: groupForm.value.visible_to_admins,
        visible_to_super_admins: groupForm.value.visible_to_super_admins
      }, authStore.user?.id || 'admin')
      
      // Add to local state
      supportGroups.value.unshift(newGroup)
      console.log('Group created successfully:', newGroup)
    }

    // Close modal and reload data
    closeCreateGroupModal()
    await loadPendingRequests()
    
  } catch (error) {
    console.error('Error saving group:', error)
    showToastMessage(`Failed to save support group: ${(error as any)?.message || 'Unknown error'}`, 'error')
  } finally {
    savingGroup.value = false
  }
}

// Filter and search methods
const applyFilters = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  searchQuery.value = ''
  typeFilter.value = ''
  sortBy.value = 'created_at'
  currentPage.value = 1
}

const joinGroup = async (group: SupportGroup) => {
          console.log('🚀 [GroupManagementView] joinGroup called for group:', group.name, 'is_member:', group.is_member)
  
  if (!authStore.user?.id) {
    showToastMessage('Please login to join groups', 'warning')
    return
  }

  try {
    if (group.is_member) {
      // If already a member, go to the group chat
      console.log('User is already a member, navigating to chat')
      router.push(`/support-group/${group.id}/chat`)
    } else {
      console.log('Attempting to join group:', group.id)
      
      // Join the group
      await supportGroupsService.joinGroup(group.id, authStore.user.id)
      console.log('Successfully joined group via service')
      
      // Update local state immediately for better UX - mark as member first
      const groupIndex = supportGroups.value.findIndex(g => g.id === group.id)
      if (groupIndex !== -1) {
        console.log('Updating local state for group index:', groupIndex)
        supportGroups.value[groupIndex] = {
          ...supportGroups.value[groupIndex],
          is_member: true,
          member_count: (supportGroups.value[groupIndex].member_count || 0) + 1
        }
        console.log('Local state updated, is_member is now:', supportGroups.value[groupIndex].is_member)
        
        // Save to cache for persistence
        saveMembershipToCache(group.id, true)
      }
      
      showToastMessage(`Successfully joined ${group.name}`, 'success')
      
      // Refresh data in background to sync with database
      loadSupportGroups().catch(error => {
        console.error('Error refreshing support groups after join:', error)
      })
      
      // Redirect to the support group chat
      router.push(`/support-group/${group.id}/chat`)
    }
  } catch (error: any) {
    console.error('Error with group action:', error)
    
    // Revert local state changes on error
    const groupIndex = supportGroups.value.findIndex(g => g.id === group.id)
    if (groupIndex !== -1) {
      console.log('Reverting local state due to error')
      supportGroups.value[groupIndex] = {
        ...supportGroups.value[groupIndex],
        is_member: false,
        member_count: Math.max((supportGroups.value[groupIndex].member_count || 1) - 1, 0)
      }
      
      // Don't save the reverted state to cache since it was an error
    }
    
    // Handle specific user profile creation errors
    if (error.message && error.message.includes('User profile not found')) {
      showToastMessage(
        'Account setup incomplete. Please try refreshing the page or contact support if this persists.', 
        'error'
      )
    } else if (error.message && error.message.includes('row-level security policy')) {
      showToastMessage(
        'Database configuration issue. Please contact support to set up user profile creation.', 
        'error'
      )
    } else {
      showToastMessage('Failed to join group. Please try again.', 'error')
    }
  }
}

const leaveGroup = async (group: SupportGroup, event: Event) => {
  event.stopPropagation()
  
  if (!authStore.user?.id) {
    showToastMessage('Please login to manage groups', 'warning')
    return
  }

          console.log('🚀 [GroupManagementView] leaveGroup called for group:', group.name, 'is_member:', group.is_member)

  try {
    await supportGroupsService.leaveGroup(group.id, authStore.user.id)
    console.log('Successfully left group via service')
    
    // Update local state immediately for better UX
    const groupIndex = supportGroups.value.findIndex(g => g.id === group.id)
    if (groupIndex !== -1) {
      console.log('Updating local state for group index:', groupIndex)
      supportGroups.value[groupIndex] = {
        ...supportGroups.value[groupIndex],
        is_member: false,
        member_count: Math.max((supportGroups.value[groupIndex].member_count || 1) - 1, 0)
      }
      console.log('Local state updated, is_member is now:', supportGroups.value[groupIndex].is_member)
      
      // Save to cache for persistence
      saveMembershipToCache(group.id, false)
    }
    
    showToastMessage(`Left ${group.name}`, 'success')
    
    // Refresh data in background to sync with database
    loadSupportGroups().catch(error => {
      console.error('Error refreshing support groups after leave:', error)
    })
  } catch (error) {
    console.error('Error leaving group:', error)
    
    // Revert local state changes on error
    const groupIndex = supportGroups.value.findIndex(g => g.id === group.id)
    if (groupIndex !== -1) {
      console.log('Reverting local state due to error')
      supportGroups.value[groupIndex] = {
        ...supportGroups.value[groupIndex],
        is_member: true,
        member_count: (supportGroups.value[groupIndex].member_count || 0) + 1
      }
    }
    
    showToastMessage('Failed to leave group', 'error')
  }
}

const loadSupportGroups = async () => {
  if (!authStore.isAuthenticated || !userRole.value) {
    console.log('Not authenticated or no user role:', { authenticated: authStore.isAuthenticated, userRole: userRole.value })
    return
  }
  
  try {
          console.log('=== GroupManagementView loadSupportGroups ===')
    console.log('User authenticated:', authStore.isAuthenticated)
    console.log('User role:', userRole.value)
    console.log('User ID:', authStore.user?.id)
    
    // Pass userId to get membership status
    const groups = await supportGroupsService.getSupportGroups(userRole.value, authStore.user?.id)
    console.log('=== Groups loaded in MySupportView ===')
    console.log('Number of groups returned:', groups.length)
    
    // Log membership status for each group for debugging
    groups.forEach((group, index) => {
      console.log(`Group ${index + 1}: ${group.name}`)
      console.log(`  - is_member: ${group.is_member}`)
      console.log(`  - member_role: ${group.member_role}`)
      console.log(`  - member_count: ${group.member_count}`)
      console.log(`  - joined_at: ${group.joined_at}`)
    })
    
    // Merge with cached membership data as fallback
    const cachedMemberships = loadMembershipFromCache()
    const groupsWithCache = groups.map(group => {
      const cached = cachedMemberships[group.id]
      
      // If database doesn't have membership but cache does, use cache
      if (!group.is_member && cached && cached.is_member) {
        console.log(`Using cached membership for ${group.name}: ${cached.is_member}`)
        return {
          ...group,
          is_member: cached.is_member
        }
      }
      
      return group
    })
    
    supportGroups.value = groupsWithCache
    
    console.log('Support groups state updated. Current group membership status:')
    supportGroups.value.forEach((group, index) => {
      console.log(`  ${index + 1}. ${group.name}: ${group.is_member ? 'MEMBER' : 'NOT MEMBER'}`)
    })
    
    // Update cache with fresh database data
    groups.forEach(group => {
      if (group.is_member !== undefined) {
        saveMembershipToCache(group.id, group.is_member)
      }
    })
  } catch (error) {
    console.error('Error loading support groups:', error)
    showToastMessage('Failed to load support groups', 'error')
  }
}

const loadPendingRequests = async () => {
  try {
    console.log('Loading pending join requests...')
    const requests = await supportGroupsService.getJoinRequests()
    
    // Group requests by support group ID
    groupJoinRequests.value = {}
    requests.forEach(request => {
      const groupId = request.support_group_id
      if (!groupJoinRequests.value[groupId]) {
        groupJoinRequests.value[groupId] = []
      }
      groupJoinRequests.value[groupId].push(request)
    })
    
    console.log('Pending requests loaded successfully:', requests.length)
  } catch (error) {
    console.error('Error loading pending requests:', error)
    groupJoinRequests.value = {}
  }
}

const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

const closeToast = () => {
  showToast.value = false
}

onMounted(async () => {
  // Clean up old cached data
  cleanupMembershipCache()
  
  if (authStore.isAuthenticated) {
    loading.value = true
    try {
      // Load support groups and user data
      await Promise.all([
        loadSupportGroups(),
        loadPendingRequests()
      ])
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      loading.value = false
    }
  }
  
  // Add resize listener
  window.addEventListener('resize', handleResize)
  
  // Check main sidebar state
  checkMainSidebarState()
  
  // Watch for sidebar changes using MutationObserver
  const observer = new MutationObserver(() => {
    checkMainSidebarState()
  })
  
  const adminSidebar = document.querySelector('.sidebar')
  if (adminSidebar) {
    observer.observe(adminSidebar, { attributes: true, attributeFilter: ['class'] })
  }
  
  // Store observer for cleanup
  onUnmounted(() => {
    observer.disconnect()
    window.removeEventListener('resize', handleResize)
  })
})
</script>

<style scoped>
.support-groups-view {
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
  .support-groups-view {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .support-groups-view.sidebar-collapsed {
    left: 70px;
  }
}

/* Top Actions */
.top-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.top-actions .btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #B91C1C;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.top-actions .btn:hover {
  background: #991b1b;
  transform: translateY(-1px);
}

/* Management Tabs */
.management-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  overflow: hidden;
}

.tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #B91C1C #f1f1f1;
}

.tabs::-webkit-scrollbar {
  height: 4px;
}

.tabs::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.tabs::-webkit-scrollbar-thumb {
  background: #B91C1C;
  border-radius: 2px;
}

.tab-btn {
  flex: 1;
  min-width: 180px;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
  font-size: 0.9rem;
}

.tab-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.tab-btn.active {
  color: #B91C1C;
  border-bottom-color: #B91C1C;
  background: white;
  font-weight: 600;
}

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.search-bar {
  position: relative;
  margin-bottom: 1rem;
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
  transition: border-color 0.2s;
}

.search-bar input:focus {
  outline: none;
  border-color: #B91C1C;
  box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.1);
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 0.9rem;
  min-width: 150px;
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #B91C1C;
  box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.1);
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
  padding: 3rem 2rem;
  text-align: center;
  color: #6c757d;
}

.loading-state i {
  font-size: 2rem;
  color: #dc6bac;
  margin-bottom: 1rem;
}

.empty-state i {
  font-size: 3rem;
  color: #bdc3c7;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  color: #495057;
}

.sub-text {
  color: #6c757d !important;
  font-size: 0.9rem !important;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #dc6bac;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  margin-top: 1rem;
}

.action-btn:hover {
  background: #c85499;
  transform: translateY(-1px);
}

.resources-grid, .groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.resource-card, .group-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;
}

.resource-card:hover, .group-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.resource-header, .group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.resource-category {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.resource-category.medical { background: rgba(52, 152, 219, 0.1); color: #3498db; }
.resource-category.financial { background: rgba(39, 174, 96, 0.1); color: #27ae60; }
.resource-category.legal { background: rgba(142, 68, 173, 0.1); color: #8e44ad; }
.resource-category.emotional { background: rgba(231, 76, 60, 0.1); color: #e74c3c; }
.resource-category.safety { background: rgba(243, 156, 18, 0.1); color: #f39c12; }
.resource-category.educational { background: rgba(26, 188, 156, 0.1); color: #1abc9c; }

.remove-btn {
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: #e74c3c;
}

/* Activity indicators */
.activity-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.activity-indicator.active {
  color: #27ae60;
}

.activity-indicator.recent {
  color: #f39c12;
}

.activity-indicator.inactive {
  color: #95a5a6;
}

.group-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.last-activity {
  font-size: 0.8rem;
  color: #6c757d;
}

.resource-content h3, .group-card h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.description {
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.resource-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item, .detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.85rem;
}

.meta-item i, .detail i {
  color: #adb5bd;
  width: 12px;
}

.view-btn, .join-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #dc6bac;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.view-btn:hover, .join-btn:hover {
  background: #c85499;
  transform: translateY(-1px);
}

.group-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.group-badge.active {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.group-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.85rem;
}

.stat i {
  color: #dc6bac;
  width: 14px;
}

.info-banner {
  background: linear-gradient(135deg, rgba(220, 107, 172, 0.1) 0%, rgba(255, 255, 255, 0.1) 100%);
  border: 1px solid rgba(220, 107, 172, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.banner-content i {
  font-size: 1.5rem;
  color: #dc6bac;
}

.banner-content h4 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
}

.banner-content p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.sessions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.sessions-header h3 {
  margin: 0;
  color: #2c3e50;
}

.schedule-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #dc6bac;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.schedule-btn:hover {
  background: #c85499;
}

.sessions-list h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.session-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.session-card.upcoming {
  border-left: 4px solid #dc6bac;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.session-info h5 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.counselor {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.confirmed {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
}

.session-details {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.session-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.join-session-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.join-session-btn:hover {
  background: #219a52;
}

.reschedule-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.reschedule-btn:hover {
  background: #e9ecef;
  color: #495057;
}



/* Support Groups Grid */
.support-groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.support-group-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #e1e8ed;
}

.support-group-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.group-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
  line-height: 1.4;
}

.group-type-badge {
  background: #B91C1C;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  white-space: nowrap;
}

.group-description {
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.meta-item i {
  width: 16px;
  color: #B91C1C;
}

.group-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.join-btn, .view-btn {
  background: #B91C1C;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.view-btn {
  background: #27ae60;
}

.view-btn:hover {
  background: #219a52;
  transform: translateY(-1px);
}

.join-btn:hover {
  background: #991b1b;
  transform: translateY(-1px);
}

.member-badge {
  color: #27ae60 !important;
  font-weight: 600;
}

.member-badge i {
  color: #27ae60 !important;
}

.leave-btn {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.2s;
  font-size: 1rem;
  line-height: 1;
}

.leave-btn:hover {
  background: #f8f9fa;
}

/* Admin Controls */
.admin-controls {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%);
  color: white;
}

.controls-title h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.controls-title p {
  margin: 0;
  opacity: 0.9;
  font-size: 1rem;
}

.create-group-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: white;
  color: #B91C1C;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.create-group-btn:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.filters-section {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e9ecef;
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
  border-color: #B91C1C;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 0.9rem;
  min-width: 150px;
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
}

.clear-filters-btn:hover {
  background: #e9ecef;
  color: #495057;
}

/* Enhanced Group Cards */
.chat-btn, .manage-btn {
  width: 100%;
  justify-content: center;
  padding: 0.875rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-btn {
  background: #27ae60;
  color: white;
}

.chat-btn:hover {
  background: #219a52;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.manage-btn {
  background: #B91C1C;
  color: white;
}

.manage-btn:hover {
  background: #991b1b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(185, 28, 28, 0.3);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
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
  background: #B91C1C;
  border-color: #B91C1C;
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

.enhanced-modal {
  max-width: 1000px;
  max-height: 90vh;
  min-height: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
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

.modal-tabs {
  display: flex;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  overflow-x: auto;
}

.modal-tabs .tab-btn {
  flex: 1;
  min-width: 140px;
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.modal-tabs .tab-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.modal-tabs .tab-btn.active {
  color: #B91C1C;
  border-bottom-color: #B91C1C;
  background: white;
}

.group-manage-content {
  padding: 0;
}

.manage-section {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f3f4;
}

.manage-section:last-child {
  border-bottom: none;
}

.manage-section h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
  font-weight: 600;
}

/* Form Styles */
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
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #B91C1C;
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

.form-help {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  display: block;
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

/* Button Styles */
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
  background: #B91C1C;
  color: white;
  border: 1px solid #B91C1C;
}

.btn.primary:hover:not(:disabled) {
  background: #991b1b;
  border-color: #991b1b;
}

.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Visibility Controls */
.visibility-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
}

.visibility-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.visibility-row .checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  margin-bottom: 0;
}

.role-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.role-info strong {
  color: #333;
  font-weight: 600;
  font-size: 0.95rem;
}

.role-info small {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.3;
}

/* Questionnaire Styles */
.questionnaire-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.section-description {
  margin: 0.5rem 0 1rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.questionnaire-builder {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  position: relative;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: 600;
  color: #495057;
  font-size: 1.1rem;
}

.remove-question-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-question-btn:hover {
  background: #c82333;
}

.question-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.option-item .form-input {
  flex: 1;
}

.remove-option-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-option-btn:hover {
  background: #c82333;
}

.add-option-btn {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.add-option-btn:hover {
  background: #218838;
}

.add-question-section {
  display: flex;
  justify-content: center;
  padding: 1rem;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  background: #f8f9fa;
}

.add-question-btn {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1rem;
  font-weight: 500;
}

.add-question-btn:hover {
  background: #0056b3;
}

/* Overview Stats */
.group-overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.overview-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #B91C1C;
}

.overview-stat i {
  color: #B91C1C;
  font-size: 1.2rem;
}

.overview-stat span {
  color: #2c3e50;
  font-weight: 500;
}

.group-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.action-btn:hover {
  border-color: #B91C1C;
  color: #B91C1C;
  background: rgba(185, 28, 28, 0.05);
}

.action-btn i {
  font-size: 1.5rem;
}

.action-btn span {
  font-weight: 500;
  font-size: 0.9rem;
}

/* Members Management */
.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.members-search {
  max-width: 300px;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: #B91C1C;
  display: flex;
  align-items: center;
  justify-content: center;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
}

.member-details h5 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.member-details p {
  margin: 0 0 0.5rem 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.member-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.member-role {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.member-role.member {
  background: #e3f2fd;
  color: #1976d2;
}

.member-role.moderator {
  background: #f3e5f5;
  color: #7b1fa2;
}

.member-role.admin {
  background: #fff3e0;
  color: #f57c00;
}

.member-joined {
  color: #6c757d;
  font-size: 0.8rem;
}

.member-actions {
  position: relative;
}

.action-dropdown {
  position: relative;
}

.action-toggle-btn {
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
}

.action-toggle-btn:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 150px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.action-item:hover {
  background: #f8f9fa;
}

.action-item.remove {
  color: #dc3545;
}

/* Request Management */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.request-item {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.user-details h5 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.user-details p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.request-date {
  color: #adb5bd;
  font-size: 0.8rem;
}

.request-reason {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 6px;
  border-left: 3px solid #3498db;
  font-size: 0.9rem;
}

.questionnaire-answers {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: rgba(39, 174, 96, 0.1);
  border-radius: 6px;
  border-left: 3px solid #27ae60;
  font-size: 0.9rem;
}

.answers-list {
  margin-top: 0.5rem;
}

.answer-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.answer-item .question {
  font-weight: 500;
  color: #2c3e50;
}

.answer-item .answer {
  color: #495057;
  padding-left: 1rem;
  border-left: 2px solid #dee2e6;
}

.request-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.request-actions .btn {
  min-width: 100px;
}

/* Chat Tab */
.chat-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chat-header h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.chat-description {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.chat-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chat-access-btn {
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.chat-access-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(185, 28, 28, 0.3);
}

.chat-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #B91C1C;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #495057;
  font-size: 0.9rem;
}

.info-item i {
  color: #B91C1C;
  width: 18px;
  text-align: center;
}

.chat-guidelines {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
}

.chat-guidelines h5 {
  margin: 0 0 0.75rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.chat-guidelines ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #495057;
}

.chat-guidelines li {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.4;
}



/* Mobile Responsive */
@media screen and (max-width: 768px) {
  .support-groups-view {
    padding: 0.5rem;
    gap: 0.75rem;
  }

  .top-actions {
    margin-bottom: 0.5rem;
  }

  .top-actions .btn {
    padding: 0.625rem 1rem;
    font-size: 0.9rem;
  }

  .top-actions .btn span {
    display: none;
  }

  .management-tabs {
    margin-bottom: 0.75rem;
  }

  .tabs {
    padding: 0;
  }

  .tab-btn {
    min-width: 140px;
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
    flex-direction: column;
    gap: 0.25rem;
  }

  .tab-btn i {
    font-size: 1rem;
  }

  .filters-section {
    padding: 1rem;
  }

  .search-bar {
    max-width: none;
    margin-bottom: 1rem;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .filter-select {
    width: 100%;
    min-width: 0;
  }

  .clear-filters-btn {
    width: 100%;
    justify-content: center;
  }



  .support-groups-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0;
  }

  .support-group-card {
    margin: 0;
    padding: 1rem;
  }

  .group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .group-header h4 {
    font-size: 1rem;
    line-height: 1.3;
  }

  .group-type-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
  }

  .group-meta {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .meta-item {
    font-size: 0.8rem;
  }

  .group-actions .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .chat-btn, .manage-btn {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .group-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    text-align: left;
  }

  .enhanced-modal {
    max-width: 95vw;
    max-height: 95vh;
    min-height: auto;
  }

  .modal-tabs {
    flex-direction: row;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .modal-tabs .tab-btn {
    padding: 0.75rem 1rem;
    min-width: 120px;
    flex: 0 0 auto;
  }

  .modal-tabs .tab-btn span {
    display: none;
  }

  .modal-tabs .tab-btn i {
    margin: 0;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .form-section {
    padding: 1rem 1.5rem;
  }

  .form-actions {
    padding: 1rem 1.5rem;
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-actions .btn {
    width: 100%;
    order: 2;
  }

  .form-actions .btn.primary {
    order: 1;
  }

  .members-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .members-search {
    max-width: none;
  }

  .member-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .member-info {
    flex-direction: column;
    text-align: center;
  }

  .member-meta {
    justify-content: center;
  }

  .action-menu {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    right: auto;
    min-width: 200px;
  }

  .pagination {
    padding: 1rem 1.5rem;
    flex-direction: column;
    text-align: center;
  }


}

@media screen and (max-width: 480px) {
  .support-groups-view {
    padding: 0.25rem;
    gap: 0.5rem;
  }

  .top-actions .btn {
    padding: 0.5rem;
    border-radius: 50%;
    width: 44px;
    height: 44px;
  }

  .top-actions .btn i {
    margin: 0;
  }

  .management-tabs {
    margin-bottom: 0.5rem;
  }

  .tab-btn {
    min-width: 100px;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .filters-section {
    padding: 0.75rem;
  }

  .support-group-card {
    padding: 0.75rem;
    min-height: auto;
  }

  .group-header h4 {
    font-size: 0.95rem;
    line-height: 1.2;
  }

  .group-type-badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }

  .group-description {
    font-size: 0.85rem;
    line-height: 1.4;
  }

  .group-meta {
    gap: 0.375rem;
  }

  .meta-item {
    font-size: 0.75rem;
  }

  .meta-item i {
    width: 14px;
    font-size: 0.75rem;
  }

  .chat-btn, .manage-btn {
    padding: 0.625rem;
    font-size: 0.8rem;
  }

  .group-footer {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
  }

  .activity-indicator, .last-activity {
    font-size: 0.7rem;
  }

  .enhanced-modal {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .manage-section {
    padding: 0.75rem 1rem;
  }

  .overview-stat {
    padding: 0.75rem;
  }

  .form-section {
    padding: 0.75rem 1rem;
  }

  .form-actions {
    padding: 0.75rem 1rem;
  }


  }
</style> 