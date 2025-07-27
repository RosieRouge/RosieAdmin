<template>
  <div class="chats-view" :class="chatViewClasses">
    <div v-if="!authStore.isAuthenticated" class="auth-required">
      <div class="rosie-branding">
        <h1 class="rosie-title">Rosie Rouge</h1>
        <p class="rosie-subtitle">Secure & Confidential Support</p>
      </div>
      <div class="auth-content">
        <i class="fas fa-shield-alt"></i>
        <h2>Private Messages</h2>
        <p>Access your secure conversations with counselors and support team</p>
        <RouterLink to="/login" class="auth-btn">
          <i class="fas fa-right-to-bracket"></i>
          Sign In for Private Access
        </RouterLink>
      </div>
    </div>
    
    <!-- WhatsApp-like Two Panel Layout -->
    <div v-else class="chat-layout">
      <!-- Minimal Sidebar - Compact Icons -->
      <div 
        v-if="!showChatSidebar && !isMobile" 
        class="minimal-sidebar"
      >
        <div class="minimal-header">
          <button @click="toggleChatSidebar" class="show-arrow-btn">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="minimal-chats">
          <div
            v-for="conversation in conversations.slice(0, 8)"
            :key="`mini-${conversation.id}`"
            class="mini-chat-item"
            :class="{ 'active': selectedConversationId === conversation.id }"
            @click="openChat(conversation)"
            :title="conversation.other_user?.name || 'Unknown User'"
          >
            <!-- Support Group Mini Icon -->
            <div v-if="conversation.type === 'support_group'" class="mini-group-avatar">
              <i class="fas fa-users"></i>
            </div>
            <!-- User Mini Avatar -->
            <template v-else>
              <img 
                v-if="conversation.other_user?.avatar"
                :src="conversation.other_user.avatar" 
                :alt="conversation.other_user?.name"
                class="mini-avatar"
              >
              <DefaultAvatar 
                v-else
                :size="32" 
                :fontSize="12"
                class="mini-avatar"
              />
            </template>
            <div v-if="conversation.unread_count && conversation.unread_count > 0" class="mini-unread-indicator">
              {{ conversation.unread_count > 9 ? '9+' : conversation.unread_count }}
            </div>
          </div>
        </div>
      </div>

      <!-- Left Sidebar - Chat List -->
      <div 
        class="chat-sidebar" 
        :class="{ 
          'mobile-hidden': showMobileChat && isMobile,
          'desktop-hidden': !showChatSidebar && !isMobile
        }"
      >
        <div class="sidebar-header">
          <!-- Messages Title and Hide Button -->
          <div class="sidebar-top-bar">
            <h1 class="messages-title-sidebar">
              Messages
              <span v-if="directMessagesStore.unreadCount > 0" class="unread-badge">
                {{ directMessagesStore.unreadCount }}
              </span>
            </h1>
            <div class="header-actions">
              <button @click="refreshChats" class="refresh-btn" :class="{ spinning: cacheStatus === 'loading' }" title="Refresh chats">
                <i class="fas fa-sync-alt"></i>
              </button>
              <div v-if="cacheStatus !== 'idle'" class="cache-indicator" :class="cacheStatus">
                <i v-if="cacheStatus === 'cached'" class="fas fa-database" title="Loaded from cache"></i>
                <i v-else-if="cacheStatus === 'fresh'" class="fas fa-check" title="Fresh data loaded"></i>
                <i v-else-if="cacheStatus === 'loading'" class="fas fa-spinner fa-spin" title="Loading..."></i>
              </div>
              <button v-if="!isMobile" @click="toggleChatSidebar" class="hide-arrow-btn">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <!-- Message Filter Tabs -->
          <div class="filter-tabs">
            <button 
              @click="activeFilter = 'all'"
              :class="{ active: activeFilter === 'all' }"
              class="filter-tab"
            >
              <i class="fas fa-comments"></i>
              <span class="tab-text">All</span>
              <span v-if="allConversationsCount > 0" class="count">{{ allConversationsCount }}</span>
            </button>

            <button 
              @click="activeFilter = 'groups'"
              :class="{ active: activeFilter === 'groups' }"
              class="filter-tab"
            >
              <i class="fas fa-users"></i>
              <span class="tab-text">Groups</span>
              <span v-if="groupConversationsCount > 0" class="count">{{ groupConversationsCount }}</span>
            </button>

            <button 
              v-if="userRole === 'counselor' || userRole === 'admin' || userRole === 'super_admin'"
              @click="activeFilter = 'counseling'"
              :class="{ active: activeFilter === 'counseling' }"
              class="filter-tab counseling-tab"
            >
              <i class="fas fa-user-md"></i>
              <span class="tab-text">Counseling</span>
              <span v-if="counselingConversationsCount > 0" class="count">{{ counselingConversationsCount }}</span>
            </button>

            <button 
              v-if="userRole === 'admin' || userRole === 'super_admin'"
              @click="activeFilter = 'admin'"
              :class="{ active: activeFilter === 'admin' }"
              class="filter-tab admin-tab"
            >
              <i class="fas fa-shield-alt"></i>
              <span class="tab-text">Admin</span>
              <span v-if="adminConversationsCount > 0" class="count">{{ adminConversationsCount }}</span>
            </button>
          </div>
        </div>

        <div class="chats-container">
          <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading conversations...</p>
          </div>

          <div v-else-if="conversations.length === 0" class="empty-state">
            <i class="fas fa-comments"></i>
            <p>No conversations yet</p>
            <p class="subtext">Start a conversation by messaging someone from your Inner Circle or communities</p>
          </div>

          <div v-else class="chats-list">
            <div
              v-for="conversation in conversations"
              :key="conversation.id"
              class="chat-item"
              :class="{ 
                'crisis-chat': (conversation as any).is_crisis_chat,
                'active': selectedConversationId === conversation.id
              }"
              @click="openChat(conversation)"
            >
              <div class="avatar-container">
                <!-- Support Group Icon -->
                <div v-if="conversation.type === 'support_group'" class="group-avatar">
                  <i class="fas fa-users"></i>
                </div>
                <!-- User Avatar -->
                <template v-else>
                  <img 
                    v-if="conversation.other_user?.avatar"
                    :src="conversation.other_user.avatar" 
                    :alt="conversation.other_user?.name"
                    class="avatar"
                  >
                  <DefaultAvatar 
                    v-else
                    :size="40" 
                    :fontSize="16"
                    class="avatar"
                  />
                </template>
                <div v-if="conversation.unread_count && conversation.unread_count > 0" class="unread-indicator">
                  {{ conversation.unread_count }}
                </div>
              </div>
              
              <div class="chat-info">
                <div class="chat-header">
                  <div class="chat-title-container">
                    <h3>{{ conversation.other_user?.name || 'Unknown User' }}</h3>
                  </div>
                  <span class="timestamp">{{ formatTime(conversation.last_message_at) }}</span>
                </div>
                
                <div class="last-message">
                  <template v-if="conversation.type === 'support_group'">
                    <span v-if="conversation.group_data?.last_message_sender_name && conversation.group_data?.last_message_content" class="message-compact">
                      <span class="sender-name">{{ conversation.group_data.last_message_sender_id === authStore.user?.id ? 'You' : conversation.group_data.last_message_sender_name }}:</span>
                      <span :class="{ unread: conversation.unread_count && conversation.unread_count > 0 }">{{ conversation.group_data?.last_message_content || 'No messages yet' }}</span>
                    </span>
                    <span v-else class="no-messages">No messages yet</span>
                  </template>
                  <template v-else>
                    <span class="message-compact">
                      <span v-if="conversation.last_message?.sender_id === authStore.user?.id" class="sender-name">You:</span>
                      <span :class="{ unread: conversation.unread_count && conversation.unread_count > 0 }">{{ conversation.last_message?.content || 'No messages yet' }}</span>
                    </span>
                  </template>
                </div>
              </div>
              
              <div class="chat-actions">
                <i class="fas fa-chevron-right"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Chat Content -->
      <div class="chat-content-panel" :class="{ 
        'mobile-visible': showMobileChat && isMobile,
        'mobile-hidden': !showMobileChat && isMobile 
      }">
        <!-- Desktop Chat Header with Current Chat Title -->
        <div v-if="!isMobile && selectedConversationId" class="desktop-chat-header">
          <div class="chat-title-header">
            <div class="chat-title-info">
              <!-- Group Chat Avatar -->
              <div v-if="selectedConversationType === 'support_group'" class="chat-header-avatar group-avatar-small">
                <i class="fas fa-users"></i>
              </div>
              <!-- Direct Chat Avatar -->
              <template v-else>
                <img 
                  v-if="getCurrentConversation()?.other_user?.avatar"
                  :src="getCurrentConversation()?.other_user?.avatar" 
                  :alt="getCurrentConversation()?.other_user?.name"
                  class="chat-header-avatar"
                >
                <DefaultAvatar 
                  v-else
                  :size="32" 
                  :fontSize="12"
                  class="chat-header-avatar"
                />
              </template>
              <div class="chat-title-text">
                <h2 class="chat-name">
                  {{ selectedConversationType === 'support_group' 
                      ? getCurrentConversation()?.other_user?.name || getCurrentConversation()?.group_data?.name || 'Group Chat'
                      : getCurrentConversation()?.other_user?.name || 'Unknown User' 
                  }}
                </h2>
                <p v-if="selectedConversationType === 'support_group'" class="chat-subtitle">
                  {{ getCurrentConversation()?.member_count || getCurrentConversation()?.group_data?.member_count || 0 }} members
                </p>
              </div>
            </div>
            <div class="chat-header-actions">
              <!-- Members button for group chats -->
              <button 
                v-if="selectedConversationType === 'support_group'" 
                @click="showGroupMembers(getCurrentConversation())" 
                class="members-btn-header"
                :title="`View ${getCurrentConversation()?.member_count || 0} members`"
              >
                <i class="fas fa-users"></i>
                <span class="btn-text">Members</span>
                <span v-if="getCurrentConversation()?.member_count" class="btn-badge">{{ getCurrentConversation()?.member_count }}</span>
              </button>
              
              <button v-if="!showChatSidebar" @click="toggleChatSidebar" class="show-sidebar-btn">
                <i class="fas fa-chevron-left"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Mobile Back Header -->
        <div v-if="isMobile && selectedConversationId" class="mobile-back-header">
          <button @click="closeMobileChat" class="mobile-back-btn">
            <i class="fas fa-arrow-left"></i>
            Back to Chats
          </button>
        </div>

        <!-- Chat Content -->
        <div v-if="selectedConversationId" class="chat-content">
          <!-- Direct Message Chat -->
          <ChatView 
            v-if="selectedConversationType === 'direct'"
            :key="`direct-${selectedConversationId}`"
            :conversationId="selectedConversationId"
            :isEmbedded="true"
            @back="closeMobileChat"
          />
          
          <!-- Group Chat -->
          <GroupChatView 
            v-else-if="selectedConversationType === 'support_group'"
            :key="`group-${selectedConversationId}`"
            :groupId="selectedConversationId"
            :isEmbedded="true"
            @back="closeMobileChat"
          />
        </div>

        <!-- Empty State - No Chat Selected -->
        <div v-else class="chat-placeholder">
          <div class="placeholder-content">
            <i class="fas fa-comments"></i>
            <h2>Select a conversation</h2>
            <p v-if="showChatSidebar || isMobile">Choose a conversation from the list to start messaging</p>
            <p v-else>Click "Show Chat List" above to see your conversations and start messaging</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Members Modal -->
    <div v-if="showMembersModal" class="modal-overlay" @click="showMembersModal = false">
      <div class="members-modal" @click.stop>
        <div class="modal-header">
          <h3>Group Members</h3>
          <button @click="showMembersModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div v-if="selectedGroupMembers.length === 0" class="empty-state">
            <i class="fas fa-user-friends"></i>
            <p>No members found</p>
          </div>
          <div v-else class="members-list">
            <div v-for="member in selectedGroupMembers" :key="member.user_id" class="member-item">
              <div class="member-avatar">
                <img v-if="member.user?.avatar" :src="member.user.avatar" :alt="member.user?.name" @error="handleAvatarError" />
                <DefaultAvatar v-else :size="36" :fontSize="14" />
              </div>
              <div class="member-info">
                <div class="member-name">{{ member.user?.name || member.name || 'Unknown User' }}</div>
                <div class="member-role">{{ member.role || 'Member' }}</div>
                <div class="member-joined">Joined {{ formatTime(new Date(member.joined_at)) }}</div>
              </div>
              <div class="member-actions">
                <button 
                  v-if="member.user_id !== authStore.user?.id" 
                  @click="startPrivateChat(member.user_id, member.user?.name)"
                  class="message-btn"
                  title="Send private message"
                >
                  <i class="fas fa-comment"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDirectMessagesStore } from '@/stores/index'
import { useAuthStore } from '@/stores/auth'
import { supportGroupsService } from '@/services/supportGroupsService'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import ChatView from '@/views/ChatView.vue'
import GroupChatView from '@/views/GroupChatView.vue'

const router = useRouter()
const directMessagesStore = useDirectMessagesStore()
const authStore = useAuthStore()

const loading = ref(false)
const cacheStatus = ref<'loading' | 'cached' | 'fresh' | 'idle'>('idle')
const activeFilter = ref<'all' | 'groups' | 'counseling' | 'admin'>('all')
const supportGroups = ref<any[]>([])
const selectedConversationId = ref<string | null>(null)
const selectedConversationType = ref<'direct' | 'support_group'>('direct')

// Cache for conversations and messages
const conversationsCache = ref<any[]>([])
const supportGroupsCache = ref<any[]>([])
const messageCache = ref<{[key: string]: any[]}>({})
const lastCacheUpdate = ref<number>(0)
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Members modal state
const showMembersModal = ref(false)
const selectedGroupMembers = ref<any[]>([])

// Mobile responsiveness and sidebar toggle
const isMobile = ref(window.innerWidth <= 768)
const showChatSidebar = ref(true)
const showMobileChat = ref(false)

// Detect if main app sidebar is collapsed by checking if we can find the collapsed class
const isMainSidebarCollapsed = ref(false)

const checkMainSidebarState = () => {
  const adminSidebar = document.querySelector('.sidebar')
  if (adminSidebar) {
    isMainSidebarCollapsed.value = adminSidebar.classList.contains('collapsed')
  }
}

// Get user role from auth
const userRole = computed(() => authStore.profile?.role || 'client')

// Computed for chat view classes
const chatViewClasses = computed(() => ({
  'sidebar-collapsed': isMainSidebarCollapsed.value && !isMobile.value
}))

const conversations = computed(() => {
  const directConversations = directMessagesStore.conversations
  
  // Convert support groups to conversation format with proper member count and recent messages
  const groupConversations = supportGroups.value.map(group => ({
    id: group.id,
    type: 'support_group',
    is_group_chat: true,
    is_member: group.is_member,
    other_user: {
      name: group.name,
      avatar: group.avatar || null
    },
    last_message: {
      content: group.last_message_content || 'No messages yet',
      sender_id: group.last_message_sender_id || null,
      created_at: group.last_message_at || group.updated_at
    },
    last_message_at: group.last_message_at || group.updated_at || group.created_at,
    unread_count: group.unread_count || 0,
    member_count: group.member_count || 0,
    members: group.members || [],
    group_data: group
  }))
  
  let allConversations = [...directConversations, ...groupConversations]
  
  // Sort by last message time (most recent first)
  allConversations.sort((a, b) => {
    const aTime = new Date(a.last_message_at || 0).getTime()
    const bTime = new Date(b.last_message_at || 0).getTime()
    return bTime - aTime
  })
  
  if (activeFilter.value === 'all') {
    return allConversations
  } else if (activeFilter.value === 'groups') {
    // Filter for group conversations (support groups)
    return groupConversations
  } else if (activeFilter.value === 'counseling') {
    // Filter for counseling-specific conversations
    return directConversations.filter((conv: any) => 
      (conv as any).is_counseling_chat === true || 
      (conv as any).is_case_related === true
    )
  } else if (activeFilter.value === 'admin') {
    // Filter for admin-specific conversations
    return directConversations.filter((conv: any) => 
      (conv as any).is_admin_chat === true
    )
  } else {
    return allConversations
  }
})

const allConversationsCount = computed(() => directMessagesStore.conversations.length + supportGroups.value.length)

const groupConversationsCount = computed(() => supportGroups.value.length)

const counselingConversationsCount = computed(() => 
  directMessagesStore.conversations.filter((conv: any) => 
    (conv as any).is_counseling_chat === true || 
    (conv as any).is_case_related === true
  ).length
)

const adminConversationsCount = computed(() => 
  directMessagesStore.conversations.filter((conv: any) => 
    (conv as any).is_admin_chat === true
  ).length
)

// Handle window resize for mobile responsiveness
const handleResize = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth <= 768
  
  // Auto-show sidebar when transitioning from mobile to desktop
  if (wasMobile && !isMobile.value) {
    showChatSidebar.value = true
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated && authStore.user?.id) {
    await loadConversations()
    await loadSupportGroups()
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
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden'
  
  // Listen for private chat initiation from GroupChatView
  const handleConversationSelection = async (event: CustomEvent) => {
    const { conversationId, userId, userName } = event.detail
    
    try {
      // Use the store method to create or get the conversation from the database
      const actualConversationId = await directMessagesStore.createOrGetConversation(authStore.user!.id, userId)
      
      // Select the conversation
      selectedConversationId.value = actualConversationId
      selectedConversationType.value = 'direct'
      
      // If on mobile, show the chat panel
      if (isMobile.value) {
        showMobileChat.value = true
      }
    } catch (error) {
      console.error('Error handling conversation selection:', error)
    }
  }
  
  window.addEventListener('selectConversation', handleConversationSelection as any)
  
  // Store observer for cleanup
  const cleanup = () => {
    observer.disconnect()
    window.removeEventListener('selectConversation', handleConversationSelection as any)
    document.body.style.overflow = ''
  }
  
  onUnmounted(cleanup)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  // Restore body scroll
  document.body.style.overflow = ''
})

// Watch for auth changes
watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
  if (isAuthenticated && authStore.user?.id) {
    await loadConversations()
    await loadSupportGroups()
  }
})

const loadConversations = async (forceRefresh = false) => {
  if (!authStore.user?.id) return
  
  const now = Date.now()
  const cacheValid = now - lastCacheUpdate.value < CACHE_DURATION
  
  // Use cache if valid and not forcing refresh
  if (cacheValid && !forceRefresh && conversationsCache.value.length > 0) {
    console.log('📦 Using cached conversations')
    cacheStatus.value = 'cached'
    // Update store with cached data
    directMessagesStore.conversations = conversationsCache.value
    setTimeout(() => cacheStatus.value = 'idle', 1000)
    return
  }
  
  loading.value = true
  cacheStatus.value = 'loading'
  try {
    console.log('🔄 Loading fresh conversations from database')
    await directMessagesStore.loadConversations(authStore.user.id)
    
    // Cache the loaded conversations
    conversationsCache.value = [...directMessagesStore.conversations]
    lastCacheUpdate.value = now
    cacheStatus.value = 'fresh'
    
    console.log('💾 Cached conversations:', conversationsCache.value.length)
    setTimeout(() => cacheStatus.value = 'idle', 2000)
  } catch (error) {
    console.error('Error loading conversations:', error)
    cacheStatus.value = 'idle'
  } finally {
    loading.value = false
  }
}

const loadSupportGroups = async (forceRefresh = false) => {
  if (!authStore.user?.id) return
  
  const now = Date.now()
  const cacheValid = now - lastCacheUpdate.value < CACHE_DURATION
  
  // Use cache if valid and not forcing refresh
  if (cacheValid && !forceRefresh && supportGroupsCache.value.length > 0) {
    console.log('📦 Using cached support groups')
    supportGroups.value = supportGroupsCache.value
    return
  }
  
  try {
    console.log('🔄 Loading fresh support groups from database')
    const userRole = authStore.profile?.role || 'client'
    const groups = await supportGroupsService.getSupportGroups(userRole, authStore.user.id)
    
    // For admins, show all groups regardless of membership
    // For regular users, only show groups where they are members
    if (userRole === 'admin' || userRole === 'super_admin') {
      supportGroups.value = groups || []
      console.log('Admin user - showing all support groups:', groups.length)
    } else {
      // Filter groups where user is a member
      supportGroups.value = groups.filter(group => group.is_member) || []
      console.log('Regular user - showing member groups only:', supportGroups.value.length)
    }
    
    // Cache the loaded support groups
    supportGroupsCache.value = [...supportGroups.value]
    console.log('💾 Cached support groups:', supportGroupsCache.value.length)
  } catch (error) {
    console.error('Error loading support groups:', error)
  }
}

const clearCache = () => {
  console.log('🗑️ Clearing conversation cache')
  conversationsCache.value = []
  supportGroupsCache.value = []
  messageCache.value = {}
  lastCacheUpdate.value = 0
}

const preloadRecentMessages = async (conversationId: string, type: 'direct' | 'support_group') => {
  // Skip if already cached
  if (messageCache.value[conversationId]) {
    console.log('📦 Messages already cached for:', conversationId)
    return
  }
  
  try {
    console.log('🔄 Preloading recent messages for:', conversationId)
    
    if (type === 'direct') {
      // Load recent direct messages
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (!error && messages) {
        messageCache.value[conversationId] = messages.reverse() // Reverse to get chronological order
        console.log('💾 Cached', messages.length, 'direct messages for:', conversationId)
      }
    } else if (type === 'support_group') {
      // Load recent group messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('support_group_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (!error && messages) {
        messageCache.value[conversationId] = messages.reverse() // Reverse to get chronological order
        console.log('💾 Cached', messages.length, 'group messages for:', conversationId)
      }
    }
  } catch (error) {
    console.error('❌ Error preloading messages:', error)
  }
}

const openChat = async (conversation: any) => {
  selectedConversationId.value = conversation.id
  selectedConversationType.value = conversation.type === 'support_group' ? 'support_group' : 'direct'
  
  // Preload recent messages for this conversation
  preloadRecentMessages(conversation.id, selectedConversationType.value)
  
  // Auto-join support groups when clicked (for admin panel)
  if (conversation.type === 'support_group' && !conversation.is_member && authStore.user?.id) {
    try {
      console.log('🔄 Auto-joining support group:', conversation.other_user?.name)
      
      // Join the group automatically
      await supportGroupsService.joinGroup(conversation.id, authStore.user.id)
      
      // Update the local conversation data to reflect membership
      const groupIndex = supportGroups.value.findIndex(g => g.id === conversation.id)
      if (groupIndex !== -1) {
        supportGroups.value[groupIndex] = {
          ...supportGroups.value[groupIndex],
          is_member: true,
          member_count: (supportGroups.value[groupIndex].member_count || 0) + 1
        }
      }
      
      // Update cache as well
      const cacheIndex = supportGroupsCache.value.findIndex(g => g.id === conversation.id)
      if (cacheIndex !== -1) {
        supportGroupsCache.value[cacheIndex] = {
          ...supportGroupsCache.value[cacheIndex],
          is_member: true,
          member_count: (supportGroupsCache.value[cacheIndex].member_count || 0) + 1
        }
      }
      
      console.log('✅ Successfully auto-joined group')
    } catch (error) {
      console.error('❌ Error auto-joining group:', error)
      // Continue anyway - admin bypass should still allow access
    }
  }
  
  // On mobile, show the chat panel and hide sidebar
  if (isMobile.value) {
    showMobileChat.value = true
  }
}

const showGroupMembers = async (conversation: any) => {
  console.log('🔍 showGroupMembers called with conversation:', conversation)
  console.log('🔍 Conversation members:', conversation.members)
  console.log('🔍 Conversation type:', conversation.type)
  console.log('🔍 Conversation ID:', conversation.id)
  
  if (conversation.type === 'support_group') {
    // Fetch fresh member data directly from the database like GroupChatView does
    console.log('🔍 Fetching fresh member data for group:', conversation.id)
    
    try {
      // Get members from support_group_members table
      const { data: membersData, error: membersError } = await supabase
        .from('support_group_members')
        .select('user_id, role, joined_at')
        .eq('support_group_id', conversation.id)
        .is('left_at', null)

      if (membersError) {
        console.error('❌ Error loading support group members:', membersError)
        selectedGroupMembers.value = []
        showMembersModal.value = true
        return
      }

      console.log('🔍 Found support group members:', membersData)

      if (!membersData || membersData.length === 0) {
        console.log('📝 No members found for this group')
        selectedGroupMembers.value = []
        showMembersModal.value = true
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(membersData.map((m: any) => m.user_id))]
      console.log('🔍 Fetching user details for IDs:', userIds)

      // Fetch user details using admin client to bypass RLS (same as GroupChatView)
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, avatar')
        .in('id', userIds)

      if (usersError) {
        console.error('❌ Error fetching user details:', usersError)
        selectedGroupMembers.value = []
        showMembersModal.value = true
        return
      }

      console.log('🔍 Found user details:', usersData)

      // Combine member data with user details (same logic as GroupChatView)
      const freshMembers = membersData.map((member: any) => {
        const userDetail = usersData?.find((user: any) => user.id === member.user_id)
        console.log('🔍 Processing member:', { 
          member_user_id: member.user_id, 
          userDetail_id: userDetail?.id,
          userDetail_name: userDetail?.name,
          userDetail_email: userDetail?.email,
          found_match: !!userDetail 
        })
        
        // Same name resolution logic as GroupChatView
        let displayName = 'Unknown User'
        if (userDetail?.name) {
          displayName = userDetail.name
        } else if (userDetail?.email) {
          displayName = userDetail.email.split('@')[0]
        } else if (member.user_id) {
          displayName = `User ${member.user_id.slice(0, 8)}`
        }
        
        return {
          id: member.user_id,
          user_id: member.user_id,
          name: displayName,
          email: userDetail?.email || '',
          avatar: userDetail?.avatar || null,
          role: member.role || 'member',
          joined_at: member.joined_at,
          // Add nested user object for template compatibility
          user: {
            id: member.user_id,
            name: displayName,
            email: userDetail?.email || '',
            avatar: userDetail?.avatar || null
          }
        }
      })

      console.log('✅ Processed fresh members for ChatsView:', freshMembers)
      selectedGroupMembers.value = freshMembers
      console.log('🎭 About to show members modal with', freshMembers.length, 'members')
      showMembersModal.value = true
      console.log('🎭 Members modal showMembersModal.value is now:', showMembersModal.value)
      
    } catch (error) {
      console.error('❌ Error in showGroupMembers:', error)
      selectedGroupMembers.value = []
      showMembersModal.value = true
    }
  } else {
    console.log('❌ Cannot show members: not a support group')
    selectedGroupMembers.value = []
    showMembersModal.value = true
  }
}

const openGroupChatInNewView = () => {
  if (selectedConversationId.value) {
    router.push(`/support-group/${selectedConversationId.value}/chat`)
  }
}

const closeMobileChat = () => {
  if (isMobile.value) {
    showMobileChat.value = false
    selectedConversationId.value = null
  }
}

const refreshChats = async () => {
  console.log('🔄 Manual refresh requested')
  clearCache()
  await Promise.all([
    loadConversations(true),
    loadSupportGroups(true)
  ])
}

const toggleChatSidebar = () => {
  showChatSidebar.value = !showChatSidebar.value
}

const handleAvatarError = (event: Event) => {
  console.error('Avatar failed to load, falling back to default')
  const img = event.target as HTMLImageElement
  if (img) {
    img.style.display = 'none'
  }
}

const startPrivateChat = async (userId: string, userName?: string) => {
  if (!authStore.user?.id || !userId || userId === authStore.user.id) return
  
  try {
    // Use the store method to create or get the conversation from the database
    const conversationId = await directMessagesStore.createOrGetConversation(authStore.user.id, userId)
    
    // Close members modal and open the chat within ChatsView
    showMembersModal.value = false
    selectedConversationId.value = conversationId
    selectedConversationType.value = 'direct'
    
    // If on mobile, show the chat panel
    if (isMobile.value) {
      showMobileChat.value = true
    }
  } catch (error) {
    console.error('Error starting private chat:', error)
  }
}

const getCurrentConversation = () => {
  if (!selectedConversationId.value) return null
  return conversations.value.find(conv => conv.id === selectedConversationId.value)
}

const formatTime = (date: Date) => {
  if (!date) return ''
  
  const now = new Date()
  const messageDate = new Date(date)
  const diff = now.getTime() - messageDate.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) {
    return 'Just now'
  } else if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else if (days < 7) {
    return `${days}d ago`
  } else {
    return messageDate.toLocaleDateString()
  }
}
</script>

<style scoped>
.chats-view {
  height: 100vh;
  background-color: #f5f5f5;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 280px; /* Account for main app sidebar */
  right: 0;
  bottom: 0;
}

/* Mobile adjustments */
@media (max-width: 1023px) {
  .chats-view {
    top: 60px !important; /* Mobile header height */
    left: 0 !important;
    height: calc(100vh - 130px) !important; /* Account for mobile header + bottom nav */
    bottom: 70px !important;
  }
}

.chat-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.chat-sidebar {
  width: 400px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  height: 100%;
  max-height: 100%;
  transition: transform 0.3s ease, width 0.3s ease;
}

.chat-content-panel {
  flex: 1;
  background: #f8f9fa;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  transition: width 0.3s ease;
}

.auth-required {
  text-align: center;
  padding: 0;
  background: white;
  border-radius: 12px;
  max-width: 500px;
  margin: 2rem auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.rosie-branding {
  background: linear-gradient(135deg, #dc6bac 0%, #b85a95 100%);
  color: white;
  padding: 2rem;
  margin-bottom: 0;
}

.rosie-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  font-family: 'Georgia', serif;
}

.rosie-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  font-style: italic;
  margin: 0.5rem 0 0 0;
}

.auth-content {
  padding: 2rem;
}

.auth-content i {
  font-size: 3rem;
  color: #dc6bac;
  margin-bottom: 1rem;
}

.auth-content h2 {
  color: #333;
  margin-bottom: 1rem;
}

.auth-content p {
  color: #666;
  margin-bottom: 2rem;
}

.auth-btn {
  background: #dc6bac;
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 1rem;
}

.auth-btn:hover {
  background: #c85499;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 107, 172, 0.3);
}

.sidebar-header {
  background-color: white;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
  overflow: visible;
  position: relative;
  z-index: 10;
}

.sidebar-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.messages-title-sidebar {
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.hide-arrow-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.refresh-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.2s;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-btn:hover {
  background: #f0f0f0;
  color: #007AFF;
  transform: rotate(90deg);
}

.refresh-btn.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cache-indicator {
  font-size: 0.7rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.cache-indicator.cached {
  color: #007AFF;
}

.cache-indicator.fresh {
  color: #28a745;
}

.cache-indicator.loading {
  color: #ffc107;
}

.hide-arrow-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.unread-badge {
  background: #ff3b30;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
}

.filter-tabs {
  display: flex;
  gap: 0.25rem;
  margin-top: 0;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: thin;
  scrollbar-color: #007AFF #f1f1f1;
  position: relative;
  min-height: 40px;
  align-items: flex-end;
}

.filter-tabs::-webkit-scrollbar {
  height: 3px;
}

.filter-tabs::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.filter-tabs::-webkit-scrollbar-thumb {
  background: #007AFF;
  border-radius: 3px;
}

.filter-tab {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #666;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  border-radius: 8px 8px 0 0;
  white-space: nowrap;
  min-width: fit-content;
  font-size: 0.875rem;
  height: 44px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.filter-tab:hover {
  background: #f8f9fa;
  color: #333;
}

.filter-tab.active {
  color: #007AFF;
  border-bottom-color: #007AFF;
  background: #f0f8ff;
}

.tab-text {
  display: inline;
}

.filter-tab .count {
  background: #e9ecef;
  color: #666;
  border-radius: 10px;
  padding: 0.125rem 0.375rem;
  font-size: 0.65rem;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.filter-tab.active .count {
  background: #007AFF;
  color: white;
}

.chats-container {
  flex: 1;
  overflow-y: auto;
  background: white;
  min-height: 0;
  position: relative;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.loading-state i {
  font-size: 2rem;
  color: #007AFF;
  margin-bottom: 1rem;
  display: block;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-state i {
  font-size: 4rem;
  color: #ccc;
  margin-bottom: 1rem;
  display: block;
}

.empty-state p {
  margin: 0.5rem 0;
}

.subtext {
  color: #999;
  font-size: 0.9rem;
}

.chats-list {
  background-color: white;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  min-height: 60px;
}

.chat-item:last-child {
  border-bottom: none;
}

.chat-item:hover {
  background-color: #f8f8f8;
}

.chat-item.active {
  background-color: #e3f2fd;
  border-right: 3px solid #2196F3;
}

.avatar-container {
  position: relative;
  margin-right: 0.75rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.unread-indicator {
  position: absolute;
  top: -3px;
  right: -3px;
  background: #ff3b30;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
  border: 2px solid white;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.125rem;
}

.chat-title-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.chat-header h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
  font-weight: 600;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #666;
  background: #f0f0f0;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  flex-shrink: 0;
  border: none;
  cursor: default;
}

.member-count.inline {
  display: inline-flex;
  margin-left: 0.5rem;
  font-size: 0.7rem;
  vertical-align: middle;
  font-weight: 400;
}

.member-count.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.member-count.clickable:hover {
  background: #dc6bac;
  color: white;
  transform: scale(1.05);
}

.member-count i {
  font-size: 0.7rem;
}

.timestamp {
  font-size: 0.7rem;
  color: #999;
  white-space: nowrap;
}

.last-message {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.3;
}

.message-compact {
  display: flex;
  gap: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.sender-name {
  color: #007AFF;
  font-weight: 500;
  flex-shrink: 0;
}

.no-messages {
  color: #999;
  font-style: italic;
  font-size: 0.75rem;
}

.unread {
  color: #333;
  font-weight: 600;
}

.chat-actions {
  color: #ccc;
  font-size: 0.9rem;
}

/* Group Avatar Styles */
.group-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.3);
}

/* Chat Content */
.chat-content {
  flex: 1;
  height: 100%;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* Ensure embedded chat views fill space properly */
.chat-content > * {
  flex: 1;
  min-height: 0;
}

/* Chat Placeholder */
.chat-placeholder, .group-chat-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f8f9fa;
}

.placeholder-content {
  text-align: center;
  color: #666;
  max-width: 300px;
}

.placeholder-content i {
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 1rem;
}

.placeholder-content h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.placeholder-content p {
  margin: 0 0 1.5rem 0;
}

.open-chat-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: #dc6bac;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.open-chat-btn:hover {
  background: #c85499;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 107, 172, 0.3);
}

/* Desktop Chat Header */
.desktop-chat-header {
  background: white;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.chat-title-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-title-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chat-header-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.group-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(185, 28, 28, 0.3);
}

.chat-title-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-subtitle {
  margin: 0;
  font-size: 0.75rem;
  color: #666;
  line-height: 1;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.members-btn-header {
  background: #B91C1C;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.members-btn-header:hover {
  background: #DC2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.3);
}

.members-btn-header .btn-badge {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 0.125rem 0.375rem;
  font-size: 0.7rem;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.show-sidebar-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.show-sidebar-btn:hover {
  background: #f0f0f0;
  color: #333;
}

/* Minimal Sidebar */
.minimal-sidebar {
  width: 60px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  height: 100%;
  transition: width 0.3s ease;
}

.minimal-header {
  background-color: white;
  padding: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.show-arrow-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.show-arrow-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.minimal-chats {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.mini-chat-item {
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 50%;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-chat-item:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

.mini-chat-item.active {
  background: #e3f2fd;
  border: 2px solid #2196F3;
}

.mini-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.mini-group-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #B91C1C 0%, #DC2626 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
  box-shadow: 0 2px 4px rgba(185, 28, 28, 0.3);
}

.mini-unread-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ff3b30;
  color: white;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  font-weight: 600;
  border: 1px solid white;
}

/* Desktop Sidebar Hidden */
.chat-sidebar.desktop-hidden {
  transform: translateX(-100%);
  width: 0;
  min-width: 0;
  border-right: none;
}

/* Mobile Back Header */
.mobile-back-header {
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  display: none;
}

.mobile-back-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.mobile-back-btn:hover {
  color: #333;
}

/* Responsive for collapsed sidebar */
@media (min-width: 769px) {
  .chats-view.sidebar-collapsed {
    left: 70px; /* Collapsed sidebar width */
  }
}

/* Members button responsive */
@media (max-width: 900px) {
  .members-btn-header .btn-text {
    display: none;
  }
  
  .members-btn-header {
    padding: 0.5rem;
    min-width: 36px;
    justify-content: center;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .chats-view {
    position: fixed;
    top: 60px; /* Account for app header on mobile */
    left: 0; /* No sidebar on mobile */
    right: 0;
    bottom: 70px; /* Account for bottom navigation on mobile */
    height: calc(100vh - 130px);
  }
  
  .chat-layout {
    position: relative;
    height: 100%;
    overflow: hidden;
  }
  
  .chat-sidebar {
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    height: 100%;
    max-height: 100%;
    transform: translateX(0);
    transition: transform 0.3s ease;
  }
  
  .chat-sidebar.mobile-hidden {
    transform: translateX(-100%);
  }
  
  .chat-content-panel {
    width: 100%;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 15;
    height: 100%;
    max-height: 100%;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .chat-content-panel.mobile-visible {
    transform: translateX(0);
  }
  
  .chat-content-panel.mobile-hidden {
    transform: translateX(100%);
  }
  
  .mobile-back-header {
    display: block;
  }
  
  .sidebar-header {
    padding: 0.5rem;
  }
  
  /* Ensure chat content has bottom padding on mobile for bottom nav */
  .chat-content-panel {
    padding-bottom: 10px;
  }
  
  .chat-content {
    padding-bottom: 10px;
  }
  
  .sidebar-header h1 {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
  }
  
  .filter-tabs {
    margin-top: 0.25rem;
    min-height: 36px;
    gap: 0.125rem;
    padding-bottom: 4px;
  }
  
  .filter-tab {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    gap: 0.25rem;
    height: 36px;
    min-width: 60px;
    border-radius: 6px 6px 0 0;
  }
  
  .tab-text {
    display: none;
  }
  
  .filter-tab i {
    font-size: 0.875rem;
  }
  
  .filter-tab .count {
    font-size: 0.6rem;
    padding: 0.1rem 0.3rem;
  }
  
  .chat-item {
    padding: 0.5rem;
    min-height: 50px;
  }
  
  .message-compact {
    max-width: 130px;
  }
}

/* Crisis Chat Styles */
.crisis-tab {
  color: #dc2626 !important;
}

.crisis-tab.active {
  color: #dc2626 !important;
  border-bottom-color: #dc2626 !important;
  background: #fef2f2 !important;
}

.crisis-count {
  background: #dc2626 !important;
  color: white !important;
  animation: pulse-crisis 2s infinite;
}

@keyframes pulse-crisis {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.chat-item.crisis-chat {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-left: 4px solid #dc2626;
  position: relative;
}

.chat-item.crisis-chat::before {
  content: "🚨";
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 1.2rem;
  animation: pulse-crisis 2s infinite;
}

.chat-item.crisis-chat:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.chat-item.crisis-chat .chat-header h3 {
  color: #dc2626;
  font-weight: 700;
}

.chat-item.crisis-chat .last-message {
  color: #991b1b;
  font-weight: 500;
}

/* Counseling Tab Styles */
.counseling-tab {
  color: #3b82f6 !important;
}

.counseling-tab.active {
  color: #3b82f6 !important;
  border-bottom-color: #3b82f6 !important;
  background: #eff6ff !important;
}

/* Admin Tab Styles */
.admin-tab {
  color: #9333ea !important;
}

.admin-tab.active {
  color: #9333ea !important;
  border-bottom-color: #9333ea !important;
  background: #faf5ff !important;
}

/* Members Modal Styles */
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
  z-index: 9999;
  padding: 1rem;
}

.members-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.members-list {
  padding: 1rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.member-item:hover {
  background: #f9fafb;
}

.member-avatar {
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.member-role {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: capitalize;
  margin-bottom: 0.125rem;
}

.member-joined {
  font-size: 0.7rem;
  color: #9ca3af;
}

.member-actions {
  flex-shrink: 0;
}

.message-btn {
  background: #dc6bac;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.message-btn:hover {
  background: #c85499;
  transform: scale(1.05);
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.empty-state i {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
  display: block;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}
</style> 