<template>
  <div class="support-groups-view">
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
      <div class="groups-grid grid">
        <div v-for="group in paginatedGroups" :key="group.id" class="group-card">
          <div class="group-content">
            <div class="group-title">
              <h3>{{ group.name }}</h3>
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
              <div class="meta-item">
                <i class="fas fa-shield-alt"></i>
                <span>Confidential & Secure</span>
              </div>
            </div>

            <div class="group-manage-section">
              <div class="group-action-buttons">
                <button @click="openGroupChat(group)" class="btn secondary btn-chat">
                  <i class="fas fa-comments"></i>
                  Open Chat
                </button>
                <button @click="manageGroup(group)" class="btn primary btn-manage">
                  <i class="fas fa-cog"></i>
                  Manage Group
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
      </div>

      <!-- Pagination -->
      <div class="pagination">
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

    <!-- Enhanced Group Management Modal -->
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

              <!-- Role Visibility Section - Disabled (fields don't exist in database schema) -->
              <!-- 
              <div class="form-section">
                <h4>Who Can See This Group</h4>
                <p class="section-description">Role-based visibility is not implemented in the database schema yet.</p>
                <div class="info-message">
                  <i class="fas fa-info-circle"></i>
                  <span>All groups are currently visible to all users. Role-based visibility will be added in a future update.</span>
                </div>
              </div>
              -->

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

    <!-- Ban/Mute User Modals removed - not implemented in database schema -->

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

              <!-- Group Type field removed - not in database schema -->
              <!-- 
              <div class="form-group">
                <label for="group-type">Group Type *</label>
                <select 
                  id="group-type"
                  v-model="groupForm.group_type" 
                  class="form-select"
                  required
                >
                  <option value="support">Support Group (Shows in My Support)</option>
                  <option value="chat">Chat Group (Shows in Messages)</option>
                </select>
                <small>Support groups are for ongoing support and counseling. Chat groups are for general communication.</small>
              </div>
              -->
              
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

            <!-- Role Visibility Section - Disabled (fields don't exist in database schema) -->
            <!-- 
            <div class="form-section">
              <h4>Who Can See This Group</h4>
              <p class="section-description">Role-based visibility is not implemented in the database schema yet.</p>
              <div class="info-message">
                <i class="fas fa-info-circle"></i>
                <span>All groups are currently visible to all users. Role-based visibility will be added in a future update.</span>
              </div>
            </div>
            -->

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supportGroupsService, type SupportGroup, type CreateSupportGroupData, type SupportGroupFilters, type JoinRequest, type GroupStatistics, type SupportGroupCategory, type SupportGroupType, type MeetingType, type GroupStatus } from '@/services/supportGroupsService'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Component state
const loading = ref(true)
const loadingRequests = ref(false)
const loadingStats = ref(false)
const searchQuery = ref('')
const categoryFilter = ref<SupportGroupCategory | ''>('')
const typeFilter = ref<SupportGroupType | ''>('')
const statusFilter = ref<GroupStatus | ''>('')
const countryFilter = ref('')
const languageFilter = ref('')
const meetingTypeFilter = ref<MeetingType | ''>('')
const sortBy = ref('created_at')
const currentPage = ref(1)
const itemsPerPage = ref(12)
const showCreateGroupModal = ref(false)
const showGroupManageModal = ref(false)
const selectedGroupForManagement = ref<SupportGroup | null>(null)
const groupJoinRequests = ref<Record<string, JoinRequest[]>>({})
const editingGroup = ref<SupportGroup | null>(null)
const selectedGroup = ref<SupportGroup | null>(null)
const savingGroup = ref(false)
const activeTab = ref<'all' | 'public' | 'private'>('all')
const selectedGroups = ref<string[]>([])
const bulkAction = ref('')
const activeManageTab = ref<'overview' | 'edit' | 'members' | 'requests' | 'chat'>('overview')
const loadingMembers = ref(false)
const memberSearchQuery = ref('')
const activeMemberActions = ref<string | null>(null)
// Ban/mute functionality removed - not implemented in database schema

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
  group_type?: 'support' | 'chat'
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
  // Role-based visibility controls
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
  // Role-based visibility controls
  visible_to_users: true,
  visible_to_counselors: true,
  visible_to_admins: true,
  visible_to_super_admins: true
})

// Data
const supportGroups = ref<SupportGroup[]>([])
const pendingRequests = ref<JoinRequest[]>([])
const groupMembers = ref<any[]>([])
const groupModerators = ref<any[]>([])
const stats = ref<GroupStatistics>({
  total_groups: 0,
  active_groups: 0,
  pending_groups: 0,
  total_members: 0,
  avg_members_per_group: 0,
  new_groups_this_week: 0,
  groups_approved_today: 0,
  groups_by_category: {} as Record<SupportGroupCategory, number>,
  groups_by_country: {} as Record<string, number>,
  groups_by_language: {} as Record<string, number>,
  recent_activity: []
})



onMounted(async () => {
  console.log('Support Groups View mounted - loading data...')
  await Promise.all([
    loadSupportGroups(),
    loadStats(),
    loadPendingRequests()
  ])
})

const loadSupportGroups = async () => {
  loading.value = true
  try {
    console.log('Loading support groups...')
    const groups = await supportGroupsService.getAllSupportGroups()
    supportGroups.value = groups
    console.log('Support groups loaded successfully:', groups.length)
  } catch (error) {
    console.error('Error loading support groups:', error)
    supportGroups.value = []
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  loadingStats.value = true
  try {
    console.log('Loading support group statistics...')
    const statistics = await supportGroupsService.getGroupStatistics()
    stats.value = statistics
    console.log('Stats loaded successfully:', statistics)
  } catch (error) {
    console.error('Error loading stats:', error)
    // Fallback to empty stats
    stats.value = {
      total_groups: 0,
      active_groups: 0,
      pending_groups: 0,
      total_members: 0,
      avg_members_per_group: 0,
      new_groups_this_week: 0,
      groups_approved_today: 0,
      groups_by_category: {
        pre_abortion: 0,
        post_abortion: 0,
        crisis_support: 0,
        ongoing_support: 0,
        legal_support: 0,
        financial_support: 0,
        emotional_support: 0,
        teen_support: 0,
        partner_support: 0,
        family_support: 0
      },
      groups_by_country: {},
      groups_by_language: {},
      recent_activity: []
    }
  } finally {
    loadingStats.value = false
  }
}

const loadPendingRequests = async () => {
  loadingRequests.value = true
  try {
    console.log('Loading pending join requests...')
    const requests = await supportGroupsService.getJoinRequests()
    pendingRequests.value = requests
    
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
    pendingRequests.value = []
    groupJoinRequests.value = {}
  } finally {
    loadingRequests.value = false
  }
}

// Computed properties
const filteredGroups = computed(() => {
  let result = supportGroups.value

  // Filter by active tab
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

// Methods
const applyFilters = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  searchQuery.value = ''
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

const getActivityClass = (group: any) => {
  const memberCount = group.member_count || 0
  const hoursSinceActivity = Math.floor((new Date().getTime() - new Date(group.last_activity || group.created_at).getTime()) / (1000 * 60 * 60))
  
  if (memberCount === 0) return 'low'
  if (hoursSinceActivity < 24 && memberCount > 5) return 'high'
  if (hoursSinceActivity < 72 || memberCount > 3) return 'medium'
  return 'low'
}

const getActivityText = (group: any) => {
  const activityClass = getActivityClass(group)
  switch (activityClass) {
    case 'high': return 'Very Active'
    case 'medium': return 'Moderately Active' 
    case 'low': return 'Low Activity'
    default: return 'Unknown'
  }
}

const getLastActivityText = (group: any) => {
  const lastActivity = new Date(group.last_activity || group.created_at)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Active now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return '1 day ago'
  return `${Math.floor(diffHours / 24)} days ago`
}

const getStatusActionClass = (group: any) => {
  switch (group.status) {
    case 'pending': return 'success'
    case 'active': return 'warning'
    default: return 'secondary'
  }
}

const getStatusActionIcon = (group: any) => {
  switch (group.status) {
    case 'pending': return 'fa-check'
    case 'active': return 'fa-pause'
    default: return 'fa-cog'
  }
}

const getStatusActionTitle = (group: any) => {
  switch (group.status) {
    case 'pending': return 'Approve Group'
    case 'active': return 'Pause Group'
    default: return 'Manage Status'
  }
}

const viewGroup = (group: any) => {
  console.log('View group:', group)
  // Navigate to group detail view
}

const editGroup = (group: any) => {
  editingGroup.value = group
  groupForm.value = {
    name: group.name || '',
    description: group.description || '',
    category: group.category || 'pre_abortion',
    type: group.type || 'peer_support',
    is_private: group.is_private ?? false,
    is_confidential: group.is_confidential ?? true,
    requires_approval: group.requires_approval ?? true,
    max_members: group.max_members || 15,
    meeting_type: group.meeting_type || 'virtual',
    meeting_schedule: group.meeting_schedule || '',
    meeting_link: group.meeting_link || '',
    meeting_location: group.meeting_location || '',
    time_zone: group.time_zone || '',
    country: group.country || '',
    region: group.region || '',
    city: group.city || '',
    language: group.language || 'en',
    moderators: group.moderators || [],
    questionnaire: group.questionnaire || [],
    // Role-based visibility controls
    visible_to_users: group.visible_to_users ?? true,
    visible_to_counselors: group.visible_to_counselors ?? true,
    visible_to_admins: group.visible_to_admins ?? true,
    visible_to_super_admins: group.visible_to_super_admins ?? true
  }
  showCreateGroupModal.value = true
}

const manageModerators = (group: any) => {
  console.log('Manage moderators for:', group)
  // Open moderators management modal
}

const toggleGroupStatus = async (group: any) => {
  try {
    const newStatus = group.status === 'pending' ? 'active' : 'pending'
    console.log(`Toggling group ${group.id} status from ${group.status} to ${newStatus}`)
    
    // Update in database
    const updatedGroup = await supportGroupsService.toggleGroupStatus(group.id, newStatus)
    
    // Update local data
    const index = supportGroups.value.findIndex(g => g.id === group.id)
    if (index !== -1) {
      supportGroups.value[index] = updatedGroup
    }
    
    console.log('Group status updated successfully:', updatedGroup)
    
    // Reload stats
    await loadStats()
  } catch (error) {
    console.error('Error toggling group status:', error)
    alert(`Failed to update group status: ${(error as any)?.message || 'Unknown error'}`)
  }
}

const getGroupJoinRequests = (groupId: string) => {
  return groupJoinRequests.value[groupId] || []
}

const openGroupChat = (group: SupportGroup) => {
  // Open the group chat using the new GroupChatView
  // Since this is admin panel, we'll open in a new tab to the user app
  const chatUrl = `https://rosieapp.org/support-group/${group.id}/chat`
  window.open(chatUrl, '_blank')
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
    // Role-based visibility controls
    visible_to_users: group.visible_to_users ?? true,
    visible_to_counselors: group.visible_to_counselors ?? true,
    visible_to_admins: group.visible_to_admins ?? true,
    visible_to_super_admins: group.visible_to_super_admins ?? true
  }
  
  // Load group members
  loadGroupMembers(group.id)
  
  showGroupManageModal.value = true
}

const closeGroupManageModal = () => {
  showGroupManageModal.value = false
  selectedGroupForManagement.value = null
}

const approveRequest = async (request: any) => {
  try {
    await supportGroupsService.approveJoinRequest(request.id, authStore.user?.id || 'admin')
    // Remove from pending requests
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== request.id)
    // Update group requests
    if (groupJoinRequests.value[request.support_group_id]) {
      groupJoinRequests.value[request.support_group_id] = groupJoinRequests.value[request.support_group_id].filter(r => r.id !== request.id)
    }
    // Reload groups to update member counts
    await loadSupportGroups()
    await loadStats()
  } catch (error) {
    console.error('Error approving request:', error)
    alert('Failed to approve request')
  }
}

const rejectRequest = async (request: any) => {
  try {
    await supportGroupsService.rejectJoinRequest(request.id, authStore.user?.id || 'admin')
    // Remove from pending requests
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== request.id)
    // Update group requests
    if (groupJoinRequests.value[request.support_group_id]) {
      groupJoinRequests.value[request.support_group_id] = groupJoinRequests.value[request.support_group_id].filter(r => r.id !== request.id)
    }
    // Reload stats
    await loadStats()
  } catch (error) {
    console.error('Error rejecting request:', error)
    alert('Failed to reject request')
  }
}

const exportGroups = () => {
  console.log('Export support groups')
  // Implement export functionality
}

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
    // Role-based visibility controls
    visible_to_users: true,
    visible_to_counselors: true,
    visible_to_admins: true,
    visible_to_super_admins: true
  }
}

// Questionnaire methods
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
        // Role-based visibility controls
        visible_to_users: groupForm.value.visible_to_users,
        visible_to_counselors: groupForm.value.visible_to_counselors,
        visible_to_admins: groupForm.value.visible_to_admins,
        visible_to_super_admins: groupForm.value.visible_to_super_admins
      }, authStore.user?.id || 'admin')
      
      // Add to local state
      supportGroups.value.unshift(newGroup)
      console.log('Group created successfully:', newGroup)
    }

    // Reload stats and close modal
    await loadStats()
    closeCreateGroupModal()
    
  } catch (error) {
    console.error('Error saving group:', error)
    console.error('Error details:', error)
    alert(`Failed to save support group: ${(error as any)?.message || 'Unknown error'}`)
  } finally {
    savingGroup.value = false
  }
}

// Computed properties
const filteredMembers = computed(() => {
  if (!memberSearchQuery.value) return groupMembers.value
  
  const query = memberSearchQuery.value.toLowerCase()
  return groupMembers.value.filter(member =>
    member.user?.name?.toLowerCase().includes(query) ||
    member.user?.email?.toLowerCase().includes(query)
  )
})

// Member management methods
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
      // Role-based visibility controls
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
    
    alert('Group updated successfully!')
  } catch (error) {
    console.error('Error updating group:', error)
    alert('Failed to update group')
  } finally {
    savingGroup.value = false
  }
}

const toggleMemberActions = (memberId: string) => {
  activeMemberActions.value = activeMemberActions.value === memberId ? null : memberId
}

// Ban modal functions removed - not implemented in database schema

// Mute modal functions removed - not implemented in database schema

// Unban/unmute functions removed - not implemented in database schema

const removeMemberFromGroup = async (member: any) => {
  if (!selectedGroupForManagement.value) return
  
  if (!confirm(`Are you sure you want to remove ${member.user?.name} from this group?`)) return
  
  try {
    await supportGroupsService.removeMember(selectedGroupForManagement.value.id, member.user_id)
    
    // Remove from local state
    groupMembers.value = groupMembers.value.filter(m => m.id !== member.id)
    
    activeMemberActions.value = null
    alert('Member removed successfully')
  } catch (error) {
    console.error('Error removing member:', error)
    alert('Failed to remove member')
  }
}

// Visibility functions removed - role-based visibility not implemented in database schema
// const getVisibilityRoles = () => { ... }
// const getCreateFormVisibilityRoles = () => { ... }
</script>

<style scoped>
.support-groups-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.top-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2rem;
}

/* Questionnaire Styles */
.questionnaire-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.questionnaire-section h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.section-description {
  margin: 0 0 1.5rem 0;
  color: #7f8c8d;
  font-size: 0.9rem;
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



.management-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e9ecef;
}

.tab-btn {
  flex: 1;
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
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #495057;
}

.tab-btn.active {
  color: #3498db;
  border-bottom-color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.tab-btn i {
  font-size: 1rem;
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

@media screen and (max-width: 768px) {
  .filters-section {
    padding: 1.5rem;
  }
}

@media screen and (max-width: 480px) {
  .filters-section {
    padding: 1rem;
  }
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 400px;
}

@media screen and (max-width: 768px) {
  .search-bar {
    max-width: none;
    width: 100%;
  }
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

@media screen and (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
}

.filters select,
.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 0.9rem;
  min-width: 150px;
  flex: 1;
  min-height: 44px;
}

@media screen and (max-width: 768px) {
  .filters select,
  .filter-select {
    width: 100%;
    min-width: 0;
  }
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

.groups-grid {
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

@media screen and (max-width: 1200px) {
  .groups-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.75rem;
  }
}

@media screen and (max-width: 768px) {
  .groups-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

@media screen and (max-width: 480px) {
  .groups-grid {
    gap: 1.25rem;
  }
}

.group-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #f1f3f4;
  min-height: 420px;
  display: flex;
  flex-direction: column;
}

.group-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #e2e8f0;
}

.group-content {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.group-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.group-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
  flex: 1;
  margin-right: 1rem;
  line-height: 1.3;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
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

.action-btn.delete {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.action-btn.delete:hover {
  background: rgba(231, 76, 60, 0.2);
}

.group-description {
  color: #6c757d;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  flex-grow: 1;
}

.group-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #495057;
  font-size: 0.85rem;
  font-weight: 500;
}

.meta-item i {
  width: 18px;
  color: #6c757d;
  font-size: 0.9rem;
}

.group-manage-section {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.group-action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-direction: column;
}

.btn-manage, .btn-chat {
  width: 100%;
  justify-content: center;
  padding: 0.875rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.btn-manage:hover, .btn-chat:hover {
  transform: translateY(-1px);
}

.btn-manage:hover {
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-chat:hover {
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.group-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.25rem;
  border-top: 1px solid #e9ecef;
  margin-top: 1rem;
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

.last-activity {
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
  flex-wrap: wrap;
  gap: 1rem;
}

@media screen and (max-width: 768px) {
  .pagination {
    padding: 1rem 1.5rem;
    flex-direction: column;
    text-align: center;
  }
}

@media screen and (max-width: 480px) {
  .pagination {
    padding: 1rem;
  }
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

@media screen and (max-width: 768px) {
  .modal-content {
    max-width: 95vw;
    max-height: 95vh;
    margin: 0.5rem;
  }
}

@media screen and (max-width: 480px) {
  .modal-content {
    max-width: 100vw;
    max-height: 100vh;
    margin: 0;
    border-radius: 0;
  }
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

.requests-content {
  padding: 2rem;
}

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

.request-info h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.request-info p {
  margin: 0.5rem 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.request-reason {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.request-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.request-actions .btn {
  min-width: 100px;
}

/* Group Management Modal Styles */
.group-manage-modal {
  max-width: 800px;
  max-height: 85vh;
  overflow-y: auto;
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

.group-overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.overview-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.overview-stat i {
  color: #3498db;
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
  border-color: #3498db;
  color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.action-btn i {
  font-size: 1.5rem;
}

.action-btn span {
  font-weight: 500;
  font-size: 0.9rem;
}

.action-btn.edit-group:hover {
  border-color: #f39c12;
  color: #f39c12;
  background: rgba(243, 156, 18, 0.05);
}

.action-btn.manage-moderators:hover {
  border-color: #8e44ad;
  color: #8e44ad;
  background: rgba(142, 68, 173, 0.05);
}

.action-btn.success:hover {
  border-color: #27ae60;
  color: #27ae60;
  background: rgba(39, 174, 96, 0.05);
}

.action-btn.warning:hover {
  border-color: #f39c12;
  color: #f39c12;
  background: rgba(243, 156, 18, 0.05);
}

.requests-list .request-item {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 1rem;
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

/* Community Creation Modal Styles */
.create-group-modal {
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
}

@media screen and (max-width: 768px) {
  .group-manage-modal,
  .create-group-modal {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .group-overview-stats {
    grid-template-columns: 1fr;
  }
  
  .group-actions-grid {
    grid-template-columns: 1fr;
  }
  
  .manage-section {
    padding: 1rem 1.5rem;
  }
}

@media screen and (max-width: 480px) {
  .group-manage-modal,
  .create-group-modal {
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
  
  .action-btn {
    padding: 1rem;
  }
}

.create-group-content {
  padding: 0;
}

.group-form {
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

/* Enhanced Mobile responsive for modal */
@media screen and (max-width: 768px) {
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
}

@media screen and (max-width: 480px) {
  .form-section {
    padding: 0.75rem 1rem;
  }
  
  .form-actions {
    padding: 0.75rem 1rem;
  }
}

/* Enhanced Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .support-groups-view {
    gap: 1.5rem;
    padding: 1rem;
  }
  
  .top-actions {
    margin-bottom: 1.5rem;
  }
  
  .group-card {
    margin-bottom: 0;
    min-height: auto;
  }
  
      .group-content {
      padding: 1.25rem;
    }
  
  .group-meta {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 0.75rem;
  }
  
  .group-actions {
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }
  
  .tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    padding: 0.75rem 1rem;
    text-align: left;
    justify-content: flex-start;
  }
}

/* Small Mobile */
@media screen and (max-width: 480px) {
  .support-groups-view {
    gap: 1rem;
    padding: 0.75rem;
  }
  
  .top-actions {
    margin-bottom: 1rem;
  }
  
      .group-content {
      padding: 1rem;
    }
  
  .group-title h3 {
    font-size: 1.1rem;
  }
  
  .group-description {
    font-size: 0.9rem;
  }
  
  .group-meta {
    padding: 0.5rem;
  }
  
  .meta-item {
    font-size: 0.8rem;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  
  .tab-btn {
    padding: 0.6rem 0.75rem;
    font-size: 0.9rem;
  }
  
  .btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
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

/* Delete Modal Styles */
.delete-modal {
  max-width: 600px;
  border: 3px solid #e74c3c;
}

.delete-modal .modal-header {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border-bottom: none;
}

.delete-modal .modal-header h3 {
  color: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.delete-modal .close-btn {
  color: rgba(255, 255, 255, 0.8);
}

.delete-modal .close-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.delete-modal-content {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.warning-section {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #feb2b2;
}

.warning-icon {
  font-size: 3rem;
  color: #e74c3c;
  flex-shrink: 0;
}

.warning-text h4 {
  margin: 0 0 1rem 0;
  color: #c53030;
  font-size: 1.2rem;
  font-weight: 700;
}

.warning-text p {
  margin: 0.5rem 0;
  color: #742a2a;
  font-size: 1rem;
}

.community-name-highlight {
  background: #e74c3c;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.1rem;
  text-align: center;
  margin: 1rem 0;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.consequences-section {
  background: #f7fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #e74c3c;
}

.consequences-section h5 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
}

.consequences-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.consequences-section li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: #4a5568;
  font-weight: 500;
}

.consequences-section li i {
  color: #e74c3c;
  width: 20px;
  text-align: center;
}

.confirmation-section {
  background: #fffaf0;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #fbd38d;
  text-align: center;
}

.confirmation-section p {
  margin: 0 0 1rem 0;
  color: #744210;
  font-weight: 600;
  font-size: 1rem;
}

.delete-confirmation-input {
  width: 100%;
  max-width: 300px;
  padding: 1rem;
  border: 3px solid #fed7d7;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: all 0.3s ease;
  background: white;
}

.delete-confirmation-input:focus {
  outline: none;
  border-color: #f56565;
  box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
}

.delete-confirmation-input.valid {
  border-color: #e74c3c;
  background: #fff5f5;
  color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2);
}

.delete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1rem;
  border-top: 2px solid #f1f3f4;
}

.delete-actions .btn {
  min-width: 180px;
  padding: 1rem 1.5rem;
  font-weight: 600;
  font-size: 1rem;
}

.btn.danger {
  background: #e74c3c;
  color: white;
  border: 2px solid #e74c3c;
  transition: all 0.3s ease;
}

.btn.danger:hover:not(:disabled) {
  background: #c0392b;
  border-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3);
}

.btn.danger:disabled {
  background: #bdc3c7;
  border-color: #bdc3c7;
  color: #7f8c8d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn.danger.pulse {
  animation: dangerPulse 2s infinite;
}

@keyframes dangerPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
  }
}

/* Mobile responsiveness for delete modal */
@media screen and (max-width: 768px) {
  .delete-modal {
    max-width: 95vw;
    margin: 1rem;
  }
  
  .delete-modal-content {
    padding: 1.5rem;
    gap: 1.5rem;
  }
  
  .warning-section {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .warning-icon {
    font-size: 2.5rem;
  }
  
  .consequences-section li {
    font-size: 0.9rem;
  }
  
  .delete-actions {
    flex-direction: column;
  }
  
  .delete-actions .btn {
    width: 100%;
    min-width: auto;
  }
}

@media screen and (max-width: 480px) {
  .delete-modal {
    max-width: 100vw;
    max-height: 100vh;
    margin: 0;
    border-radius: 0;
  }
  
  .delete-modal-content {
    padding: 1rem;
  }
  
  .warning-section,
  .consequences-section,
  .confirmation-section {
    padding: 1rem;
  }
}

/* Role Visibility Grid */
.role-visibility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.role-visibility-grid .form-group {
  margin-bottom: 0;
}

.role-visibility-grid .checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #f8f9fa;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 80px;
}

.role-visibility-grid .checkbox-label:hover {
  border-color: #B91C1C;
  background: #FDE2E2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(185, 28, 28, 0.15);
}

.role-visibility-grid .checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: #B91C1C;
  border-color: #B91C1C;
}

.role-visibility-grid .checkbox-label input[type="checkbox"]:checked ~ .role-info .role-name {
  color: #B91C1C;
  font-weight: 600;
}

.role-visibility-grid .checkbox-label input[type="checkbox"]:checked {
  accent-color: #B91C1C;
}

.role-visibility-item {
  position: relative;
}

.role-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.role-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 1rem;
}

.role-info small {
  color: #6c757d;
  font-size: 0.8rem;
  line-height: 1.3;
  margin: 0;
}

.visibility-preview {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f1f3f4;
  border-radius: 8px;
  border-left: 4px solid #B91C1C;
}

.visibility-preview strong {
  color: #2c3e50;
  margin-right: 0.5rem;
}

.no-visibility {
  color: #dc3545;
  font-weight: 500;
}

.visibility-roles {
  color: #B91C1C;
  font-weight: 500;
}

.section-description {
  margin: 0.5rem 0 1rem 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.always-visible {
  background: #f8f9fa !important;
  border-color: #adb5bd !important;
  opacity: 0.8;
  cursor: not-allowed !important;
}

.always-visible:hover {
  transform: none !important;
  box-shadow: none !important;
  border-color: #adb5bd !important;
  background: #f8f9fa !important;
}

.always-visible .checkmark.disabled {
  background: #6c757d !important;
  border-color: #6c757d !important;
}

.always-visible-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #6c757d;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

@media screen and (max-width: 768px) {
  .role-visibility-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .role-visibility-grid .checkbox-label {
    padding: 0.75rem;
  }
}

/* Enhanced Modal Styles */
.enhanced-modal {
  max-width: 1000px;
  max-height: 90vh;
  min-height: 600px;
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

.modal-tabs .tab-btn i {
  font-size: 1rem;
}

.modal-tabs .tab-btn span {
  font-size: 0.9rem;
}

/* Members Management Styles */
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

.member-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.member-status.banned {
  background: #ffebee;
  color: #c62828;
}

.member-status.muted {
  background: #fff3e0;
  color: #ef6c00;
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

.action-item.ban {
  color: #dc3545;
}

.action-item.unban {
  color: #28a745;
}

.action-item.mute {
  color: #ffc107;
}

.action-item.unmute {
  color: #17a2b8;
}

.action-item.remove {
  color: #dc3545;
}

/* Ban/Mute Modal Styles */
.ban-modal, .mute-modal {
  max-width: 500px;
}

.ban-modal-content, .mute-modal-content {
  padding: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn.warning {
  background: #ffc107;
  color: #212529;
  border: 1px solid #ffc107;
}

.btn.warning:hover {
  background: #e0a800;
  border-color: #d39e00;
}

.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #495057;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: #B91C1C;
}

/* Info message styles */
.info-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 8px;
  color: #1976d2;
  font-size: 0.9rem;
}

.info-message i {
  font-size: 1.1rem;
  color: #1976d2;
}

/* Mobile responsiveness for enhanced modal */
@media screen and (max-width: 768px) {
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
  
  .role-visibility-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .role-visibility-grid .checkbox-label {
    padding: 1rem;
    min-height: 70px;
  }
  
  .role-visibility-grid .checkbox-label:hover {
    transform: none;
  }
}

/* Chat Tab Styles */
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

/* Visibility Controls Styling */
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

.form-help {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  display: block;
}

/* Mobile responsiveness for visibility controls */
@media screen and (max-width: 768px) {
  .visibility-checkboxes {
    gap: 0.75rem;
  }
  
  .visibility-row .checkbox-label {
    flex-direction: row;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style> 