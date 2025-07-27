<template>
  <div class="topic-view" :class="{ embedded: isEmbedded }">
    <!-- Header -->
    <div v-if="(topic || isSupportGroupChat) && !isEmbedded" class="topic-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="topic-icon">{{ (topic?.icon || '👥') }}</div>
        <div class="topic-details">
          <h1>{{ topic?.name || 'Support Group Chat' }}</h1>
          <p v-if="topic?.description" class="topic-description">{{ topic.description }}</p>
          <div class="topic-meta">
            <span v-if="topic?.last_message_at && !isSupportGroupChat" class="last-activity">
              <i class="fas fa-clock"></i>
              Last activity {{ formatTime(new Date(topic.last_message_at)) }}
            </span>
            <span v-if="members.length > 0" class="member-count-header">
              <i class="fas fa-users"></i>
              {{ members.length }} {{ members.length === 1 ? 'member' : 'members' }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="action-buttons">
          <button @click.stop="handleMembersClick" class="action-btn members-btn" :title="`View ${members.length} members`">
            <i class="fas fa-users"></i>
            <span class="btn-text">Members</span>
            <span v-if="members.length > 0" class="btn-badge">{{ members.length }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Chat Container -->
    <div v-if="topic || isSupportGroupChat" class="chat-container">
      <!-- Messages -->
      <div class="messages-container" ref="messagesContainer" @scroll="handleScroll">
        <div v-if="loadingMessages" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Loading messages...
        </div>
        
        <div v-else-if="messages.length === 0" class="empty-messages">
          <i class="fas fa-comments"></i>
          <h3>No messages yet</h3>
          <p>Be the first to start the conversation!</p>
        </div>

        <div v-else class="messages-list">
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message-item"
            :class="{ 'own-message': message.sender_id === currentUserId }"
          >
            <div class="message-avatar" @click="showUserProfile(message.sender_id)">
              <img 
                v-if="message.user?.avatar || message.user_avatar"
                :src="message.user?.avatar || message.user_avatar" 
                :alt="message.user?.name || message.user_name || 'User'"
                @error="handleAvatarError"
              />
              <DefaultAvatar 
                v-else
                :size="40" 
                :fontSize="16"
              />
            </div>
            <div class="message-content">
              <div class="message-header">
                <span 
                  class="message-author"
                  @click="goToUserProfile(message.sender_id)"
                >
                  {{ message.user?.name || message.user_name || 'Anonymous' }}
                </span>
                <div class="message-header-right">
                  <span class="message-time">
                    {{ formatTime(new Date(message.created_at)) }}
                  </span>
                  <!-- Delete button - only show for user's own messages and non-deleted messages -->
                  <button 
                    v-if="message.sender_id === authStore.user?.id && !message.deleted_at"
                    @click="deleteMessage(message.id)"
                    class="delete-message-btn"
                    title="Delete message"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              
              <!-- Text Message -->
              <div v-if="!message.message_type || message.message_type === 'text'" class="message-text">
                {{ message.content }}
              </div>
              
              <!-- Voice Message -->
              <div v-else-if="message.message_type === 'voice'" class="message-voice">
                <div class="voice-message-container" @click="handleVoiceMessageClick(message)">
                  <div class="voice-play-button">
                    <i :class="playingVoiceId === message.id ? 'fas fa-pause' : 'fas fa-play'"></i>
                  </div>
                  <div class="voice-info">
                    <div class="voice-duration">
                      <span class="voice-label">Voice message</span>
                      <span class="voice-time-badge">{{ formatRecordingTime(JSON.parse(message.media_data || '{}').duration || 0) }}</span>
                    </div>
                    <div v-if="playingVoiceId === message.id" class="voice-progress-container">
                      <div 
                        class="voice-progress-bar" 
                        @click="seekVoiceMessage($event, message)"
                      >
                        <div 
                          class="voice-progress-fill"
                          :style="{ width: getVoiceProgress(message) + '%' }"
                        ></div>
                        <div 
                          class="voice-progress-handle"
                          :style="{ left: getVoiceProgress(message) + '%' }"
                        ></div>
                      </div>
                      <div class="voice-time-display">
                        <span class="voice-current-time">{{ formatRecordingTime(getVoiceCurrentTime(message)) }}</span>
                        <span class="voice-total-time">{{ formatRecordingTime(JSON.parse(message.media_data || '{}').duration || 0) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- GIF Message -->
              <div v-else-if="message.message_type === 'gif'" class="message-gif">
                <img 
                  :src="message.media_url || JSON.parse(message.media_data || '{}').url" 
                  :alt="JSON.parse(message.media_data || '{}').title || 'GIF'"
                  class="gif-image"
                />
              </div>
              
              <!-- Photo Message -->
              <div v-else-if="message.message_type === 'photo'" class="message-photos">
                <div class="photos-container">
                  <template v-if="JSON.parse(message.media_data || '{}').photo_urls?.length > 0">
                    <div 
                      v-for="(photoUrl, index) in JSON.parse(message.media_data || '{}').photo_urls" 
                      :key="index"
                      class="photo-item-display"
                      @click="openPhotoViewer(photoUrl)"
                    >
                      <img 
                        :src="photoUrl" 
                        :alt="`Photo ${index + 1}`"
                        class="photo-image"
                        @error="(e) => { const target = e.target as HTMLImageElement; target.style.display = 'none'; }"
                      />
                    </div>
                  </template>
                  <template v-else>
                    <div class="photo-placeholder" v-for="n in JSON.parse(message.media_data || '{}').photo_count || 1" :key="n">
                      <i class="fas fa-image"></i>
                      <span>Photo {{ n }}</span>
                    </div>
                  </template>
                </div>
                <div class="photos-info">
                  {{ JSON.parse(message.media_data || '{}').photo_count || 1 }} photo{{ (JSON.parse(message.media_data || '{}').photo_count || 1) > 1 ? 's' : '' }}
                  <span v-if="JSON.parse(message.media_data || '{}').placeholder" class="placeholder-note">(file storage needed)</span>
                </div>
              </div>
              
              <!-- Other message types -->
              <div v-else class="message-text">
                {{ message.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll to Bottom Button -->
      <button v-if="showScrollToBottom" class="scroll-to-bottom-btn" @click="forceScrollToBottom">
        <i class="fas fa-chevron-down"></i>
      </button>

      <!-- Message Input Container - FIXED POSITIONING -->
      <div class="message-input-container">
        <form @submit.prevent="sendMessage" class="message-form">
          <div class="input-wrapper">
            <!-- Media Menu Button -->
            <button 
              type="button" 
              class="media-btn"
              @click="showMediaMenu = true"
              title="Add photos, GIFs, or camera"
            >
              <i class="fas fa-plus"></i>
            </button>

            <!-- Voice Recording Preview or Text Input -->
            <div v-if="voiceBlob" class="voice-input-preview">
              <div class="voice-preview-display">
                <i class="fas fa-microphone"></i>
                <div class="voice-preview-info">
                  <span>Voice message ({{ formatRecordingTime(recordingTime) }})</span>
                  <div class="voice-preview-progress">
                    <div 
                      class="voice-preview-progress-bar" 
                      @click="seekVoicePreview($event)"
                    >
                      <div 
                        class="voice-preview-progress-fill"
                        :style="{ width: getVoicePreviewProgress() + '%' }"
                      ></div>
                      <div 
                        class="voice-preview-progress-handle"
                        :style="{ left: getVoicePreviewProgress() + '%' }"
                      ></div>
                    </div>
                    <div class="voice-preview-time-display">
                      <span class="voice-preview-current-time">{{ formatRecordingTime(getVoicePreviewCurrentTime()) }}</span>
                      <span class="voice-preview-total-time">{{ formatRecordingTime(recordingTime) }}</span>
                    </div>
                  </div>
                </div>
                <div class="voice-preview-controls">
                  <button 
                    type="button" 
                    class="mini-play-btn"
                    :class="{ playing: isPlayingPreview }"
                    @click="playVoicePreview"
                  >
                    <i :class="isPlayingPreview ? 'fas fa-pause' : 'fas fa-play'"></i>
                  </button>
                  <button 
                    type="button" 
                    class="mini-delete-btn"
                    @click="deleteVoiceRecording"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Recording Timer Display -->
            <div v-else-if="isRecording" class="recording-input-display">
              <div class="recording-indicator">
                <i class="fas fa-microphone recording-mic-icon"></i>
                <span class="recording-status">Recording...</span>
                <span class="recording-timer">{{ formatRecordingTime(recordingTime) }}</span>
              </div>
              <div class="recording-instruction">Click stop or press mic button again to finish</div>
            </div>
            
            <!-- Text Input -->
            <textarea
              v-else
              v-model="newMessage"
              :placeholder="isUserInCommunity ? 'Type your message...' : 'Join the community to send messages'"
              rows="1"
              ref="messageInput"
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.enter.shift.exact="addNewLine"
              @input="adjustTextareaHeight"
              :disabled="!isUserInCommunity"
            ></textarea>

            <!-- Voice Recording Button -->
            <button 
              type="button" 
              class="mic-btn"
              :class="{ 
                recording: isRecording, 
                'has-voice': !!voiceBlob 
              }"
              @click="toggleSingleClickRecording"
              :disabled="!isUserInCommunity"
            >
              <i v-if="isRecording" class="fas fa-stop"></i>
              <i v-else-if="voiceBlob" class="fas fa-check"></i>
              <i v-else class="fas fa-microphone"></i>
            </button>

            <!-- Send Button -->
            <button 
              type="submit" 
              class="send-btn"
              :disabled="(!newMessage.trim() && !voiceBlob) || sendingMessage || !isUserInCommunity"
            >
              <i class="fas fa-spinner fa-spin" v-if="sendingMessage"></i>
              <i class="fas fa-paper-plane" v-else></i>
            </button>
          </div>
        </form>
        
        <!-- Join Prompt (hidden for admins) -->
        <div v-if="!isUserInCommunity && !isAdminUser" class="join-prompt-inline">
          <button @click="joinCommunity" class="join-btn-inline" :disabled="joiningCommunity">
            <i class="fas fa-spinner fa-spin" v-if="joiningCommunity"></i>
            <i class="fas fa-plus" v-else></i>
            {{ joiningCommunity ? 'Joining...' : 'Join Community to Chat' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading">
      <div v-if="loadingTopic">
        <i class="fas fa-spinner fa-spin"></i> 
        {{ isSupportGroupChat ? 'Loading support group...' : 'Loading topic...' }}
      </div>
      <div v-else class="not-found">
        <i class="fas fa-exclamation-triangle"></i>
        <h2>{{ isSupportGroupChat ? 'Support Group Not Found' : 'Topic Not Found' }}</h2>
        <p>{{ isSupportGroupChat ? 'The support group you\'re looking for doesn\'t exist or may have been removed.' : 'The topic you\'re looking for doesn\'t exist or may have been removed.' }}</p>
        <button @click="goBack" class="back-btn">
          <i class="fas fa-arrow-left"></i>
          {{ isSupportGroupChat ? 'Back to Support Groups' : 'Back to Community' }}
        </button>
      </div>
    </div>



    <!-- Toast Notification -->
    <div v-if="showToast" class="toast" :class="toastType">
      <i :class="getToastIcon()"></i>
      {{ toastMessage }}
    </div>

    <!-- User Profile Popup -->
    <UserProfilePopup
      :userId="selectedUserId"
      :isVisible="showProfilePopup"
      @close="closeProfilePopup"
    />

    <!-- Members Modal -->
    <div v-if="showMembersList" class="modal-overlay" @click="showMembersList = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Group Members</h3>
          <button @click="showMembersList = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div v-if="loadingMembers" class="loading">
            <i class="fas fa-spinner fa-spin"></i> Loading members...
          </div>
          <div v-else-if="members.length === 0" class="empty-state">
            <i class="fas fa-user-friends"></i>
            <p>No members found</p>
          </div>
          <div v-else class="members-list">
            <div v-for="member in members" :key="member.id" class="member-item">
              <div class="member-avatar">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.name" @error="handleAvatarError" />
                <DefaultAvatar v-else :size="40" :fontSize="16" />
              </div>
              <div class="member-info">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-role">{{ member.role || 'Member' }}</div>
                <div class="member-joined">Joined {{ formatTime(new Date(member.joined_at)) }}</div>
              </div>
              <div class="member-actions">
                <button 
                  v-if="member.user_id !== authStore.user?.id" 
                  @click="startPrivateChat(member.user_id, member.name)"
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

    <!-- Media Menu Modal -->
        <div v-if="showMediaMenu" class="media-menu-overlay" @click="showMediaMenu = false">
          <div class="media-menu" @click.stop>
            <div class="media-menu-header">
          <h3>Send Media</h3>
              <button @click="showMediaMenu = false" class="close-menu-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="media-options">
              <div class="media-option" @click="openPhotoGallery">
                <div class="media-icon photos">
                  <i class="fas fa-images"></i>
                </div>
                <span>Photos</span>
              </div>
              <div class="media-option" @click="openGiphyPicker">
                <div class="media-icon gif">
                  <i class="fas fa-film"></i>
                </div>
                <span>GIFs</span>
              </div>
              <div class="media-option" @click="openCamera">
                <div class="media-icon camera">
                  <i class="fas fa-camera"></i>
                </div>
                <span>Camera</span>
              </div>
            </div>
          </div>
        </div>

    <!-- GIPHY Modal -->
        <div v-if="showGiphyPicker" class="giphy-modal-overlay" @click="showGiphyPicker = false">
          <div class="giphy-modal" @click.stop>
            <div class="giphy-header">
              <h3>Choose a GIF</h3>
              <button @click="showGiphyPicker = false" class="close-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="giphy-search">
              <input 
                v-model="giphySearchQuery" 
                @input="searchGiphy" 
            placeholder="Search GIFs..."
                class="giphy-search-input"
              />
            </div>
            <div class="giphy-results" ref="giphyResultsContainer">
              <div v-if="loadingGiphy" class="giphy-loading">
            <i class="fas fa-spinner fa-spin"></i> Loading GIFs...
              </div>
              <div v-else class="giphy-grid">
                <div 
                  v-for="gif in giphyResults" 
                  :key="gif.id"
                  class="giphy-item"
                  @click="selectGiphy(gif)"
                >
                  <img :src="gif.images.fixed_height_small.url" :alt="gif.title" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Photo Gallery Modal -->
        <div v-if="showPhotoGallery" class="photo-modal-overlay" @click="showPhotoGallery = false">
          <div class="photo-modal" @click.stop>
            <div class="photo-header">
          <h3>Send Photos</h3>
              <button @click="showPhotoGallery = false" class="close-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="photo-upload-area">
              <div class="file-info">
                <small>
                  <i class="fas fa-info-circle"></i>
              Supported formats: JPG, PNG, HEIC/HEIF • Max 5MB per image
                </small>
              </div>
          <div class="upload-prompt" @click="photoInput?.click()">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to select photos or drag and drop</p>
          </div>
              <input 
                ref="photoInput" 
                type="file" 
            accept="image/*"
                multiple 
                style="display: none"
            @change="handlePhotoSelection"
              />
            </div>
            <div v-if="selectedPhotos.length > 0" class="selected-photos">
              <div class="photo-grid">
                <div v-for="(photo, index) in selectedPhotos" :key="index" class="photo-item">
                  <img :src="photo.preview" :alt="`Photo ${index + 1}`" />
                  <button @click="removePhoto(index)" class="remove-photo-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <div class="photo-actions">
                <button @click="sendPhotos" class="send-photos-btn" :disabled="sendingMessage">
                  <i class="fas fa-spinner fa-spin" v-if="sendingMessage"></i>
                  <i class="fas fa-paper-plane" v-else></i>
              Send {{ selectedPhotos.length }} Photo{{ selectedPhotos.length > 1 ? 's' : '' }}
                </button>
              </div>
            </div>
          </div>
        </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Props
const props = defineProps<{
  groupId?: string
  isEmbedded?: boolean
  topicId?: string
}>()

// Emits
const emit = defineEmits<{
  back: []
}>()
import { useUserStore, useCommunitiesStore } from '@/stores/index'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import UserProfilePopup from '@/components/UserProfilePopup.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const communitiesStore = useCommunitiesStore()
const authStore = useAuthStore()

const { currentUser } = storeToRefs(userStore)

// User Profile Popup state
const selectedUserId = ref<string | null>(null)
const showProfilePopup = ref(false)

// Reactive state
const loadingTopic = ref(false)
const loadingMessages = ref(false)
const sendingMessage = ref(false)
const joiningCommunity = ref(false)
const showTopicSettings = ref(false)
const updatingTopic = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success')
const isDirectMemberCheck = ref(false)

// Rich Media State
const showMediaMenu = ref(false)
const showGiphyPicker = ref(false)
const showVoiceRecorder = ref(false)
const showPhotoGallery = ref(false)
const isRecording = ref(false)
const recordingTime = ref(0)
const voiceBlob = ref<Blob | null>(null)
const voiceBlobUrl = ref<string>('')
const selectedPhotos = ref<any[]>([])
const giphySearchQuery = ref('')
const giphyResults = ref<any[]>([])
const loadingGiphy = ref(false)

// Media Recorder
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<BlobPart[]>([])
const recordingTimer = ref<NodeJS.Timeout | null>(null)

// Voice Playback
const playingVoiceId = ref<string | null>(null)
const currentAudio = ref<HTMLAudioElement | null>(null)
const isPlayingPreview = ref(false)
const previewAudio = ref<HTMLAudioElement | null>(null)
const voiceCurrentTime = ref<{ [key: string]: number }>({})
const voiceProgressUpdateInterval = ref<NodeJS.Timeout | null>(null)
const previewCurrentTime = ref(0)
const previewProgressUpdateInterval = ref<NodeJS.Timeout | null>(null)

// Scroll state tracking
const isNearBottom = ref(true)
const showScrollToBottom = ref(false)

// Data
const topic = ref<any>(null)
const messages = ref<any[]>([])
const newMessage = ref('')

// Refs
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const photoInput = ref<HTMLInputElement>()
const giphyResultsContainer = ref<HTMLElement>()

// Forms
const topicSettings = ref({
  name: '',
  description: '',
  icon: '💬',
  is_hidden: false
})

// Computed properties
const communityId = computed(() => route.params.communityId as string || route.params.groupId as string)
const topicId = computed(() => {
  // Support groups don't use topics at all
  if (isSupportGroupChat.value) {
    return null
  }
  // Use prop if provided, else fallback to route
  return props.topicId || route.params.topicId as string
})
const groupId = computed(() => props.groupId || route.params.groupId as string)
const community = computed(() => communitiesStore.getCommunityById(communityId.value))

// Check if this is a support group (no topicId in route, just direct group chat)
const isSupportGroupChat = computed(() => {
  const isSupport = !!groupId.value && !route.params.topicId
  console.log('🔍 isSupportGroupChat computed:', { 
    groupId: groupId.value, 
    topicId: route.params.topicId, 
    isSupportGroupChat: isSupport 
  })
  return isSupport
})

// Computed property for consistent user ID access
const currentUserId = computed(() => {
  return authStore.user?.id || currentUser.value?.id || null
})

// Computed property for authentication status
const isAuthenticated = computed(() => {
  return authStore.isAuthenticated && !!currentUserId.value
})

const isUserInGroup = computed(() => {
  console.log('🔍 Auth store values:', {
    isAdmin: authStore.isAdmin,
    isSuperAdmin: authStore.isSuperAdmin,
    user: authStore.user,
    profile: authStore.profile,
    role: authStore.profile?.role,
    isAuthenticated: isAuthenticated.value,
    currentUserId: currentUserId.value
  })
  
  // FORCE ADMIN BYPASS - Admins can always see all groups regardless of authentication status
  if (authStore.user?.id && (authStore.isAdmin || authStore.isSuperAdmin || authStore.profile?.role === 'admin' || authStore.profile?.role === 'super_admin')) {
    console.log('✅ Admin user - FORCED bypass of membership check')
    return true
  }
  
  // Check authentication for non-admin users
  if (!isAuthenticated.value) {
    console.log('❌ Cannot check membership - not authenticated or missing ID')
    return false
  }
  
  if (!communityId.value) {
    console.log('❌ No community ID provided')
    return false
  }
  
  // For support groups, check membership directly
  if (isSupportGroupChat.value) {
    const result = isDirectMemberCheck.value
    console.log('🔍 Checking if user is in support group:', {
      isAuthenticated: isAuthenticated.value,
      userId: currentUserId.value,
      groupId: groupId.value,
      directCheck: isDirectMemberCheck.value,
      result
    })
    return result
  }
  
  // For communities with topics, use existing logic  
  const storeCheck = currentUser.value?.communities?.some((c: any) => c.communityId === communityId.value) || false
  const result = isDirectMemberCheck.value || storeCheck
  
  console.log('🔍 Checking if user is in community:', {
    isAuthenticated: isAuthenticated.value,
    userId: currentUserId.value,
    communityId: communityId.value,
    userCommunities: currentUser.value?.communities?.map((c: any) => c.communityId) || [],
    directCheck: isDirectMemberCheck.value,
    storeCheck,
    result
  })
  return result
})

// Simple admin check for template use
const isAdminUser = computed(() => {
  return !!(authStore.user?.id && (authStore.isAdmin || authStore.isSuperAdmin || authStore.profile?.role === 'admin' || authStore.profile?.role === 'super_admin'))
})

// Alias for backward compatibility with admin bypass
const isUserInCommunity = computed(() => {
  // Admins always have access
  if (isAdminUser.value) {
    console.log('✅ Template: Admin user has community access')
    return true
  }
  return isUserInGroup.value
})

const canManageTopic = computed(() => {
  if (!isUserInCommunity.value) return false
  
  // For support groups, check if user can manage the group
  if (isSupportGroupChat.value && topic.value?.support_group_data) {
    return topic.value.support_group_data.created_by === authStore.user?.id ||
           currentUser.value?.communities?.find((c: any) => c.communityId === communityId.value)?.role !== 'member'
  }
  
  // For regular topics, check topic permissions
  if (!isSupportGroupChat.value && topic.value) {
    return topic.value.created_by === authStore.user?.id || 
           currentUser.value?.communities?.find((c: any) => c.communityId === communityId.value)?.role !== 'member'
  }
  
  return false
})

// Members state
const showMembersList = ref(false)
const loadingMembers = ref(false)
const members = ref<any[]>([])

// Methods
const checkMembership = async () => {
  // ADMIN BYPASS - Admins can access all groups
  if (authStore.user?.id && (authStore.isAdmin || authStore.isSuperAdmin || authStore.profile?.role === 'admin' || authStore.profile?.role === 'super_admin')) {
    console.log('✅ Admin user - bypassing membership check')
    isDirectMemberCheck.value = true
    return
  }

  if (!isAuthenticated.value || !communityId.value) {
    console.log('❌ Cannot check membership - not authenticated or missing ID')
    return
  }
  
  if (isSupportGroupChat.value) {
  try {
      console.log('🔍 Checking support group access for:', {
      userId: currentUserId.value,
        groupId: groupId.value
      })
      
      const { data: groupData, error: groupError } = await supabase
        .from('support_groups')
        .select('id, name, visible_to_users, visible_to_counselors, visible_to_admins, visible_to_super_admins')
        .eq('id', groupId.value)
      .single()

      if (groupError) {
        console.error('❌ Error checking support group:', groupError)
        isDirectMemberCheck.value = false
        return
      }

      if (!groupData) {
        console.log('❌ Support group not found')
        isDirectMemberCheck.value = false
      return
    }

      // Check visibility based on user role
      const userRole = authStore.profile?.role || 'client'
      let isVisible = false
      
      switch (userRole) {
        case 'super_admin':
          isVisible = groupData.visible_to_super_admins
          break
        case 'admin':
          isVisible = groupData.visible_to_admins
          break
        case 'counselor':
          isVisible = groupData.visible_to_counselors
          break
        default:
          isVisible = groupData.visible_to_users
      }
      
      console.log('✅ Support group access check result:', {
        groupExists: !!groupData,
        userRole,
        isVisible,
        allowing: isVisible,
        groupVisibility: {
          visible_to_users: groupData.visible_to_users,
          visible_to_counselors: groupData.visible_to_counselors,
          visible_to_admins: groupData.visible_to_admins,
          visible_to_super_admins: groupData.visible_to_super_admins
        }
      })
      
      isDirectMemberCheck.value = isVisible
      
  } catch (error) {
      console.error('❌ Error in support group access check:', error)
    isDirectMemberCheck.value = false
    }
  } else {
    console.log('🔍 Skipping community membership check - treating as accessible')
    isDirectMemberCheck.value = true
  }
}

const loadSupportGroup = async () => {
  if (!groupId.value) {
    console.error('❌ No support group ID provided')
    return
  }

  loadingTopic.value = true // Reuse the same loading state
  try {
    console.log('🔍 Loading support group:', groupId.value)
    
    const { data, error } = await supabase
      .from('support_groups')
      .select(`
        id,
        name,
        description,
        avatar,
        created_by,
        created_at,
        category,
        type,
        status
      `)
      .eq('id', groupId.value)
      .single()

    if (error) {
      console.error('❌ Error loading support group:', error)
      throw error
    }

    // Store support group data in a similar structure for UI compatibility
    topic.value = {
      id: data.id,
      name: data.name,
      description: data.description,
      icon: '👥',
      created_by: data.created_by,
      message_count: 0, // We don't track this for support groups
      last_message_at: null,
      created_at: data.created_at,
      is_support_group: true,
      support_group_data: data
    }
    
    console.log('✅ Support group loaded:', topic.value)

  } catch (error) {
    console.error('❌ Error loading support group:', error)
    showToastMessage('Failed to load support group', 'error')
  } finally {
    loadingTopic.value = false
  }
}

const loadTopic = async () => {
  if (!topicId.value) {
    console.error('❌ No topic ID provided')
    return
  }

  loadingTopic.value = true
  try {
    console.log('🔍 Loading topic:', topicId.value)
    
    const { data, error } = await supabase
      .from('topics')
      .select(`
        id,
        name,
        description,
        icon,
        created_by,
        message_count,
        last_message_at,
        created_at,
        is_hidden,
        community_id
      `)
      .eq('id', topicId.value)
      .single()

    if (error) {
      console.error('❌ Error loading topic:', error)
      throw error
    }

    topic.value = data
    console.log('✅ Topic loaded:', topic.value)

    topicSettings.value = {
      name: topic.value.name,
      description: topic.value.description || '',
      icon: topic.value.icon || '💬',
      is_hidden: topic.value.is_hidden || false
    }

  } catch (error) {
    console.error('❌ Error loading topic:', error)
    showToastMessage('Failed to load topic', 'error')
  } finally {
    loadingTopic.value = false
  }
}

const loadMessages = async () => {
  console.log('🔍 loadMessages called:', {
    isSupportGroupChat: isSupportGroupChat.value,
    groupId: groupId.value,
    topicId: topicId.value,
    routeParams: route.params,
    currentUserId: currentUserId.value,
    isAuthenticated: isAuthenticated.value,
    isUserInGroup: isUserInGroup.value
  })
  
  // For support groups, we don't need topics - just use support_group_id directly
  if (isSupportGroupChat.value && !groupId.value) {
    console.log('❌ No support group ID available')
    return
  }
  
  if (!isSupportGroupChat.value && !topicId.value) {
    console.log('❌ No topic ID available for regular topic')
    return
  }
  
  loadingMessages.value = true
  try {
    if (isSupportGroupChat.value) {
      console.log('🔍 Loading ALL messages for support group:', groupId.value)
      
      // Query messages by support_group_id AND also check for topic-based messages
      // This ensures we get both new messages (with support_group_id) and historical messages (with topic_id)
      
      // First, get all topics for this support group to find historical messages
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id')
        .eq('support_group_id', groupId.value)
      
      const topicIds = topicsData?.map(t => t.id) || []
      console.log('🔍 Found topics for support group:', topicIds)
      
      // Query messages with support_group_id OR topic_id from support group topics
      let query = supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          message_type,
          media_url,
          media_data,
          reactions,
          support_group_id,
          topic_id
        `)
        .order('created_at', { ascending: true })
      
      // Build the OR condition for support_group_id or topic_id
      if (topicIds.length > 0) {
        query = query.or(`support_group_id.eq.${groupId.value},topic_id.in.(${topicIds.join(',')})`)
      } else {
        query = query.eq('support_group_id', groupId.value)
      }
      
      const { data: messagesData, error } = await query

      console.log('🔍 Support group messages query result:', { 
        messagesData, 
        error, 
        supportGroupId: groupId.value,
        topicIds,
        dataLength: messagesData?.length || 0,
        firstResult: messagesData?.[0],
        lastResult: messagesData?.[messagesData?.length - 1]
      })

      if (error) {
        console.error('❌ Error loading support group messages:', error)
        throw error
      }

      // Get unique sender IDs for user lookup
      const senderIds = [...new Set(messagesData?.map((msg: any) => msg.sender_id).filter(id => id) || [])]
      console.log('🔍 Message sender IDs:', senderIds)

      // Fetch user details using admin client (same as member loading)
      let usersData: any[] = []
      if (senderIds.length > 0) {
        const { data: users, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, name, email, avatar')
          .in('id', senderIds)

        if (usersError) {
          console.error('❌ Error fetching message sender details:', usersError)
        } else {
          usersData = users || []
          console.log('🔍 Found message sender details:', usersData)
        }
      }

      // Combine messages with user details
      messages.value = messagesData?.map((msg: any) => {
        const userDetail = usersData.find((user: any) => user.id === msg.sender_id)
        
        // Same robust name handling as member loading
        let displayName = 'Anonymous'
        if (userDetail?.name) {
          displayName = userDetail.name
        } else if (userDetail?.email) {
          displayName = userDetail.email.split('@')[0]
        } else if (msg.sender_id) {
          displayName = `User ${msg.sender_id.slice(0, 8)}`
        }

        console.log('🔍 Processing message sender:', {
          senderId: msg.sender_id,
          userDetail_name: userDetail?.name,
          userDetail_email: userDetail?.email,
          finalDisplayName: displayName
        })

        return {
          ...msg,
          user_id: msg.sender_id,
          user_name: displayName,
          user_avatar: userDetail?.avatar,
          user: {
            id: msg.sender_id,
            name: displayName,
            email: userDetail?.email || '',
            avatar: userDetail?.avatar || null
          }
        }
      }) || []
      
      console.log('✅ Support group messages loaded (including historical):', {
        count: messages.value.length,
        supportGroupId: groupId.value,
        messagesWithSupportGroupId: messages.value.filter(m => m.support_group_id).length,
        messagesWithTopicId: messages.value.filter(m => m.topic_id).length,
        firstMessage: messages.value[0],
        lastMessage: messages.value[messages.value.length - 1]
      })
      
    } else {
      console.log('🔍 Loading messages for topic:', topicId.value)
      
    const { data, error } = await supabase
      .rpc('get_topic_messages', { _topic_id: topicId.value })

    if (error) {
      console.error('❌ Error loading messages via RPC:', error)
      console.log('🔄 Attempting fallback to direct query...')
      const fallbackResult = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          message_type,
          media_url,
          media_data,
          reactions
        `)
        .eq('topic_id', topicId.value)
        .order('created_at', { ascending: true })

      if (fallbackResult.error) {
        console.error('❌ Error loading messages via fallback:', fallbackResult.error)
        throw fallbackResult.error
      }

      // Get unique sender IDs for user lookup (same as support group logic)
      const senderIds = [...new Set(fallbackResult.data?.map((msg: any) => msg.sender_id).filter(id => id) || [])]
      console.log('🔍 Topic message sender IDs:', senderIds)

      // Fetch user details using admin client
      let usersData: any[] = []
      if (senderIds.length > 0) {
        const { data: users, error: usersError } = await supabaseAdmin
          .from('users')
          .select('id, name, email, avatar')
          .in('id', senderIds)

        if (usersError) {
          console.error('❌ Error fetching topic message sender details:', usersError)
        } else {
          usersData = users || []
          console.log('🔍 Found topic message sender details:', usersData)
        }
      }

      messages.value = fallbackResult.data?.map((msg: any) => {
        const userDetail = usersData.find((user: any) => user.id === msg.sender_id)
        
        // Same robust name handling
        let displayName = 'Anonymous'
        if (userDetail?.name) {
          displayName = userDetail.name
        } else if (userDetail?.email) {
          displayName = userDetail.email.split('@')[0]
        } else if (msg.sender_id) {
          displayName = `User ${msg.sender_id.slice(0, 8)}`
        }

        return {
          ...msg,
          user_id: msg.sender_id,
          user_name: displayName,
          user_avatar: userDetail?.avatar,
          user: {
            id: msg.sender_id,
            name: displayName,
            email: userDetail?.email || '',
            avatar: userDetail?.avatar || null
          }
        }
      }) || []
      console.log('✅ Messages loaded via fallback:', messages.value.length, messages.value)
    } else {
      messages.value = data?.map((msg: any) => ({
        ...msg,
          user_id: msg.sender_id,
        users: {
            id: msg.sender_id,
          name: msg.user_name,
          avatar: msg.user_avatar
        },
        user: {
            id: msg.sender_id,
          name: msg.user_name,
          avatar: msg.user_avatar
        }
      })) || []
      console.log('✅ Messages loaded via RPC:', messages.value.length, messages.value)
      }
    }

    console.log('✅ Final messages array:', {
      length: messages.value.length,
      firstMessage: messages.value[0],
      lastMessage: messages.value[messages.value.length - 1],
      allMessages: messages.value
    })

    await nextTick()
    immediateScrollToBottom()
    scrollToBottom()

  } catch (error) {
    console.error('❌ Error loading messages:', error)
    showToastMessage('Failed to load messages', 'error')
  } finally {
    loadingMessages.value = false
  }
}

const sendMessage = async () => {
  const hasRequiredId = isSupportGroupChat.value ? !!groupId.value : !!topicId.value
  
  if (!newMessage.value.trim() && !voiceBlob.value) {
    console.log('❌ No message content to send')
    return
  }
  
  if (!isAuthenticated.value || !hasRequiredId || !isUserInGroup.value) {
    console.log('❌ Cannot send message:', {
      hasMessage: !!newMessage.value.trim(),
      hasVoice: !!voiceBlob.value,
      isAuthenticated: isAuthenticated.value,
      userId: currentUserId.value,
      hasTopic: !!topicId.value,
      hasGroup: !!groupId.value,
      hasRequiredId,
      isInGroup: isUserInGroup.value
    })
    return
  }
  
  sendingMessage.value = true
  try {
    console.log('📤 Sending message:', {
      content: newMessage.value.trim() || '[Voice message]',
      topicId: topicId.value,
      groupId: groupId.value,
      userId: currentUserId.value,
      communityId: communityId.value,
      isSupportGroup: isSupportGroupChat.value,
      hasVoice: !!voiceBlob.value
    })
    
    // Handle voice message
    if (voiceBlob.value) {
      console.log('🎤 Voice messaging not available in admin panel')
      showToastMessage('Voice messaging not available in admin panel', 'info')
      return
      
    const messageData = {
        content: `[Voice Message - ${formatRecordingTime(recordingTime.value)}]`,
        sender_id: currentUserId.value,
        message_type: 'voice',
        media_url: uploadResult.url,
        media_data: JSON.stringify({
          duration: recordingTime.value,
          size: voiceBlob.value.size,
          type: voiceBlob.value.type,
          file_path: uploadResult.path,
          placeholder: false
        }),
        created_at: new Date().toISOString(),
        // Set ONLY the appropriate ID based on chat type
        ...(isSupportGroupChat.value 
          ? { support_group_id: groupId.value }
          : { topic_id: topicId.value }
        )
      }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        id,
        content,
          sender_id,
        topic_id,
          support_group_id,
        created_at,
          message_type,
          media_url,
          media_data,
          users!sender_id (
            id,
            name,
            avatar,
            email
          )
        `)
        .single()

      if (error) {
        console.error('❌ Error sending voice message:', error)
        throw error
      }

      console.log('✅ Voice message sent successfully:', data)

      const messageWithUser = {
        ...data,
        user: data.users
      }
      messages.value.push(messageWithUser)
      
      deleteVoiceRecording()
      
    } else {
      // Handle text message
      const messageData: any = {
        content: newMessage.value.trim(),
        sender_id: currentUserId.value,
        created_at: new Date().toISOString(),
        // Set ONLY the appropriate ID based on chat type  
        ...(isSupportGroupChat.value 
          ? { support_group_id: groupId.value }
          : { topic_id: topicId.value }
        )
      }
      
      console.log('📤 Sending text message with data:', messageData)
      
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          id,
          content,
          sender_id,
          topic_id,
          support_group_id,
          created_at,
          users!sender_id (
            id,
            name,
            avatar,
            email
          )
        `)
        .single()

    if (error) {
      console.error('❌ Error sending message:', error)
      throw error
    }

    console.log('✅ Message sent successfully:', data)

    const messageWithUser = {
      ...data,
      user: data.users
    }
    messages.value.push(messageWithUser)
    
      newMessage.value = ''
    }
    
    // Update topic message count
    const topicUpdateResult = await supabase
      .from('topics')
      .update({
        message_count: (topic.value?.message_count || 0) + 1,
        last_message_at: new Date().toISOString()
      })
      .eq('id', topicId.value)

    if (topicUpdateResult.error) {
      console.error('❌ Error updating topic:', topicUpdateResult.error)
    }

    if (topic.value) {
      topic.value.message_count = (topic.value.message_count || 0) + 1
      topic.value.last_message_at = new Date().toISOString()
    }

    await nextTick()
    scrollToBottom()
    adjustTextareaHeight()

  } catch (error) {
    console.error('❌ Error sending message:', error)
    showToastMessage('Failed to send message. Please try again.', 'error')
  } finally {
    sendingMessage.value = false
  }
}

const joinCommunity = async () => {
  const userId = authStore.user?.id || currentUser.value?.id
  if (!userId || !communityId.value) return
  
  joiningCommunity.value = true
  try {
    const isFirstCommunity = currentUser.value?.communities.length === 0
    await userStore.joinCommunity(communityId.value, isFirstCommunity)
    
    await checkMembership()
    await userStore.loadCurrentUser(userId)
    
    showToastMessage('Successfully joined the community!', 'success')
  } catch (error) {
    console.error('❌ Error joining community:', error)
    showToastMessage('Failed to join community', 'error')
  } finally {
    joiningCommunity.value = false
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    setTimeout(() => {
      if (messagesContainer.value) {
        const container = messagesContainer.value
        container.scrollTop = container.scrollHeight + 500
        
        setTimeout(() => {
          if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight + 500
          }
        }, 100)
        
        setTimeout(() => {
          if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight + 500
          }
        }, 200)
      }
    }, 50)
  }
}

const handleScroll = () => {
  if (!messagesContainer.value) return
  
  const container = messagesContainer.value
  const scrollTop = container.scrollTop
  const scrollHeight = container.scrollHeight
  const clientHeight = container.clientHeight
  
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  isNearBottom.value = distanceFromBottom < 100
  showScrollToBottom.value = !isNearBottom.value
}

const forceScrollToBottom = () => {
  showScrollToBottom.value = false
  scrollToBottom()
}

const immediateScrollToBottom = () => {
  if (messagesContainer.value) {
    const container = messagesContainer.value
    container.scrollTop = container.scrollHeight + 500
    requestAnimationFrame(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight + 500
      }
    })
  }
}

const adjustTextareaHeight = () => {
  if (messageInput.value) {
    messageInput.value.style.height = 'auto'
    messageInput.value.style.height = Math.min(messageInput.value.scrollHeight, 120) + 'px'
  }
}

const addNewLine = () => {
  newMessage.value += '\n'
  nextTick(() => adjustTextareaHeight())
}

const goBack = () => {
  if (isSupportGroupChat.value) {
            router.push('/group-management') // Go back to support groups list
  } else {
    router.push(`/community/${communityId.value}`) // Go back to community
  }
}

const goToUserProfile = (userId: string) => {
  if (userId) {
    router.push(`/profile/${userId}`)
  }
}

const deleteMessage = async (messageId: string) => {
  if (!authStore.user?.id) return
  
  try {
    console.log('🗑️ Deleting group message:', { messageId, userId: authStore.user.id })
    
    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('messages')
      .update({ 
        deleted_at: new Date().toISOString(),
        content: '[Message deleted]'
      })
      .eq('id', messageId)
      .eq('sender_id', authStore.user.id) // Only allow deletion by sender

    if (error) {
      console.error('❌ Error deleting message:', error)
      throw error
    }

    // Update local state
    const messageIndex = messages.value.findIndex(msg => msg.id === messageId)
    if (messageIndex !== -1) {
      messages.value[messageIndex] = {
        ...messages.value[messageIndex],
        content: '[Message deleted]',
        deleted_at: new Date().toISOString()
      }
    }

    console.log('✅ Group message deleted successfully')
  } catch (error) {
    console.error('❌ Error deleting group message:', error)
  }
}

const showToastMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 4000)
}

const getToastIcon = () => {
  switch (toastType.value) {
    case 'success': return 'fas fa-check-circle'
    case 'error': return 'fas fa-exclamation-circle'
    case 'warning': return 'fas fa-exclamation-triangle'
    case 'info': return 'fas fa-info-circle'
    default: return 'fas fa-info-circle'
  }
}

const startPrivateChat = async (userId: string, userName?: string) => {
  if (!authStore.user?.id || !userId || userId === authStore.user.id) return
  
  try {
    console.log("🔄 Starting private chat with:", { userName, userId })
    
    // Generate conversation ID (sorted to ensure consistency)
    const conversationId = `dm_${[authStore.user.id, userId].sort().join('_')}`
    
    // Close the members modal
    showMembersList.value = false
    
    // Dispatch custom event for ChatsView to handle conversation selection
    const selectConversationEvent = new CustomEvent('selectConversation', {
      detail: { conversationId, userId, userName }
    })
    window.dispatchEvent(selectConversationEvent)
    
    console.log('✅ Dispatched private chat event - staying in ChatsView:', { conversationId, userId, userName })
  } catch (error) {
    console.error('Error starting private chat:', error)
    showToastMessage('Failed to start private chat', 'error')
  }
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

// Rich Media Methods
const openPhotoGallery = () => {
  showMediaMenu.value = false
  showPhotoGallery.value = true
}

const openCamera = async () => {
  showMediaMenu.value = false
      showPhotoGallery.value = true
  showToastMessage('Camera functionality coming soon! Using photo gallery.', 'info')
}

const openLocationPicker = () => {
  showMediaMenu.value = false
  showToastMessage('Location sharing coming soon!', 'info')
}

const openContactPicker = () => {
  showMediaMenu.value = false
  showToastMessage('Contact sharing coming soon!', 'info')
}

const openDocumentPicker = () => {
  showMediaMenu.value = false
  showToastMessage('Document sharing coming soon!', 'info')
}

const openPollCreator = () => {
  showMediaMenu.value = false
  showToastMessage('Poll creation coming soon!', 'info')
}

const openEventCreator = () => {
  showMediaMenu.value = false
  showToastMessage('Event creation coming soon!', 'info')
}

const openGiphyPicker = async () => {
  showMediaMenu.value = false
  showGiphyPicker.value = true
  await loadTrendingGiphy()
}

// GIPHY Methods
const loadTrendingGiphy = async () => {
  loadingGiphy.value = true
  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=Vqolh3kbCbbTNirgSTGQyrXnXjeP5LE1&limit=20&rating=pg`)
    const data = await response.json()
    giphyResults.value = data.data || []
  } catch (error) {
    console.error('Error loading trending GIFs:', error)
    showToastMessage('Failed to load GIFs', 'error')
  } finally {
    loadingGiphy.value = false
  }
}

const searchGiphy = async () => {
  if (!giphySearchQuery.value.trim()) {
    await loadTrendingGiphy()
    return
  }
  
  loadingGiphy.value = true
  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=Vqolh3kbCbbTNirgSTGQyrXnXjeP5LE1&q=${encodeURIComponent(giphySearchQuery.value)}&limit=20&rating=pg`)
    const data = await response.json()
    giphyResults.value = data.data || []
  } catch (error) {
    console.error('Error searching GIFs:', error)
    showToastMessage('Failed to search GIFs', 'error')
  } finally {
    loadingGiphy.value = false
  }
}

const selectGiphy = async (gif: any) => {
  try {
    const hasRequiredId = isSupportGroupChat.value ? !!groupId.value : !!topicId.value
    if (!isAuthenticated.value || !hasRequiredId || !isUserInCommunity.value) return

    sendingMessage.value = true
    
    const messageData = {
      content: `[GIF: ${gif.title}]`,
      sender_id: currentUserId.value,
      message_type: 'gif',
      media_url: gif.images.fixed_height.url,
      media_data: JSON.stringify({
        gif_id: gif.id,
        title: gif.title,
        url: gif.images.fixed_height.url,
        preview_url: gif.images.fixed_height_small.url
      }),
      created_at: new Date().toISOString(),
      // Set ONLY the appropriate ID based on chat type
      ...(isSupportGroupChat.value 
        ? { support_group_id: groupId.value }
        : { topic_id: topicId.value }
      )
    }
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) throw error

    const messageWithUser = {
      ...data,
      user: {
        id: currentUserId.value,
        name: currentUser.value?.name || 'You',
        avatar: currentUser.value?.avatar
      }
    }
    messages.value.push(messageWithUser)

    showGiphyPicker.value = false
    showToastMessage('GIF sent!', 'success')
    
    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('Error sending GIF:', error)
    showToastMessage('Failed to send GIF', 'error')
  } finally {
    sendingMessage.value = false
  }
}

// Voice Recording Methods
const toggleRecording = async () => {
  if (isRecording.value) {
    if (mediaRecorder.value) {
      mediaRecorder.value.stop()
      isRecording.value = false
      
      if (recordingTimer.value) {
        clearInterval(recordingTimer.value)
        recordingTimer.value = null
      }
    }
  } else {
    showMediaMenu.value = false
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorder.value = new MediaRecorder(stream)
      audioChunks.value = []
      
      mediaRecorder.value.ondataavailable = (event) => {
        audioChunks.value.push(event.data)
      }
      
      mediaRecorder.value.onstop = () => {
        const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
        voiceBlob.value = audioBlob
        
        stream.getTracks().forEach(track => track.stop())
      }
      
      isRecording.value = true
      recordingTime.value = 0
      
      recordingTimer.value = setInterval(() => {
        recordingTime.value++
      }, 1000)
      
      mediaRecorder.value.start()
      
    } catch (error: any) {
      console.error('Error accessing microphone:', error)
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.')
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.')
      } else {
        alert('Unable to access microphone. Please check your permissions and try again.')
      }
    }
  }
}

// Voice Recording State
const singleClickMode = ref(false)

const toggleSingleClickRecording = async (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  
  // Simple toggle - if recording, stop; if not, start
  if (isRecording.value) {
    await stopRecording()
  } else {
    singleClickMode.value = true
    await startRecording()
  }
}



const startRecording = async () => {
  showMediaMenu.value = false
  
  try {
    console.log('🎤 Starting voice recording...')
    
    // Request microphone permission with better audio settings
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      } 
    })
    
    // Use webm format if supported, fallback to default
    let mimeType = 'audio/webm;codecs=opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '' // Use default
      }
    }
    
    mediaRecorder.value = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    audioChunks.value = []
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }
    
    mediaRecorder.value.onstop = () => {
      console.log('🎤 Recording stopped, processing audio...')
      const audioBlob = new Blob(audioChunks.value, { type: mimeType || 'audio/webm' })
      voiceBlob.value = audioBlob
      
      // Create preview URL
      if (voiceBlobUrl.value) {
        URL.revokeObjectURL(voiceBlobUrl.value)
      }
      voiceBlobUrl.value = URL.createObjectURL(audioBlob)
      
      console.log('🎤 Voice recording ready for preview:', {
        size: audioBlob.size,
        duration: recordingTime.value,
        url: voiceBlobUrl.value
      })
      
      // Stop all tracks to release microphone
      stream.getTracks().forEach(track => track.stop())
      

    }
    
    mediaRecorder.value.onerror = (event) => {
      console.error('🎤 MediaRecorder error:', event)
      showToastMessage('Recording failed. Please try again.', 'error')
      stopRecording()
    }
    
    isRecording.value = true
    recordingTime.value = 0
    
    // Start recording timer
    recordingTimer.value = setInterval(() => {
      recordingTime.value++
    }, 1000)
    
    mediaRecorder.value.start(100) // Collect data every 100ms for better quality
    console.log('🎤 MediaRecorder started successfully')
    
  } catch (error: any) {
    console.error('🎤 Error accessing microphone:', error)
    isRecording.value = false
    
    let errorMessage = 'Unable to access microphone. '
    if (error.name === 'NotAllowedError') {
      errorMessage += 'Please allow microphone access in your browser settings.'
    } else if (error.name === 'NotFoundError') {
      errorMessage += 'No microphone found. Please connect a microphone and try again.'
    } else {
      errorMessage += 'Please check your permissions and try again.'
    }
    
    showToastMessage(errorMessage, 'error')
  }
}

const stopRecording = async () => {
  if (mediaRecorder.value && isRecording.value) {
    console.log('🎤 Stopping recording...')
    
    mediaRecorder.value.stop()
    isRecording.value = false
    singleClickMode.value = false
    
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
  }
}



const playVoicePreview = async () => {
  if (!voiceBlob.value) return
  
  if (!voiceBlobUrl.value) {
    voiceBlobUrl.value = URL.createObjectURL(voiceBlob.value)
  }
  
  if (isPlayingPreview.value) {
    if (previewAudio.value) {
      previewAudio.value.pause()
      previewAudio.value.currentTime = 0
    }
    if (previewProgressUpdateInterval.value) {
      clearInterval(previewProgressUpdateInterval.value)
      previewProgressUpdateInterval.value = null
    }
    isPlayingPreview.value = false
    previewCurrentTime.value = 0
    return
  }
  
  try {
    if (previewAudio.value) {
      previewAudio.value.pause()
      previewAudio.value.currentTime = 0
    }
    
    const audio = new Audio(voiceBlobUrl.value)
    previewAudio.value = audio
    isPlayingPreview.value = true
    
    // Restore previous position if any
    const savedTime = previewCurrentTime.value
    if (savedTime > 0) {
      audio.currentTime = savedTime
    }
    
    audio.addEventListener('ended', () => {
      isPlayingPreview.value = false
      previewAudio.value = null
      previewCurrentTime.value = 0
      if (previewProgressUpdateInterval.value) {
        clearInterval(previewProgressUpdateInterval.value)
        previewProgressUpdateInterval.value = null
      }
    })
    
    audio.addEventListener('error', () => {
      isPlayingPreview.value = false
      previewAudio.value = null
      previewCurrentTime.value = 0
      if (previewProgressUpdateInterval.value) {
        clearInterval(previewProgressUpdateInterval.value)
        previewProgressUpdateInterval.value = null
      }
    })
    
    await audio.play()
    startPreviewProgressTracking()
    
  } catch (error) {
    console.error('Error playing voice preview:', error)
    isPlayingPreview.value = false
    previewCurrentTime.value = 0
  }
}

const deleteVoiceRecording = () => {
  if (previewAudio.value) {
    previewAudio.value.pause()
    previewAudio.value.currentTime = 0
    previewAudio.value = null
  }
  if (previewProgressUpdateInterval.value) {
    clearInterval(previewProgressUpdateInterval.value)
    previewProgressUpdateInterval.value = null
  }
  isPlayingPreview.value = false
  previewCurrentTime.value = 0
  
  voiceBlob.value = null
  voiceBlobUrl.value = ''
  recordingTime.value = 0
}

const formatRecordingTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Voice Playback Methods
const handleVoiceMessageClick = (message: any) => {
  const mediaData = JSON.parse(message.media_data || '{}')
  
  if (mediaData.placeholder) {
    showToastMessage('Voice playback requires file storage setup', 'info')
    return
  }
  
  if (message.media_url) {
    toggleVoicePlayback(message)
  } else {
    showToastMessage('Voice message not available', 'error')
  }
}

const toggleVoicePlayback = async (message: any) => {
  if (!message.media_url) {
    showToastMessage('Voice message not available', 'error')
    return
  }

  if (playingVoiceId.value === message.id) {
    stopVoicePlayback()
    return
  }

  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value.currentTime = 0
  }

  try {
    const audio = new Audio(message.media_url)
    currentAudio.value = audio
    playingVoiceId.value = message.id

    // Initialize current time for this message
    if (!voiceCurrentTime.value[message.id]) {
      voiceCurrentTime.value[message.id] = 0
    }

    audio.addEventListener('ended', () => {
      voiceCurrentTime.value[message.id] = 0
      stopVoicePlayback()
    })
    
    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e)
      showToastMessage('Failed to play voice message', 'error')
      stopVoicePlayback()
    })

    audio.addEventListener('loadeddata', () => {
      // Restore previous position if any
      const savedTime = voiceCurrentTime.value[message.id] || 0
      if (savedTime > 0) {
        audio.currentTime = savedTime
      }
    })

    await audio.play()
    startVoiceProgressTracking(message.id)
    
  } catch (error) {
    console.error('Error playing voice message:', error)
    showToastMessage('Failed to play voice message', 'error')
    stopVoicePlayback()
  }
}

const stopVoicePlayback = () => {
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value.currentTime = 0
    currentAudio.value = null
  }
  if (voiceProgressUpdateInterval.value) {
    clearInterval(voiceProgressUpdateInterval.value)
    voiceProgressUpdateInterval.value = null
  }
  playingVoiceId.value = null
}

// Voice Progress Methods
const getVoiceCurrentTime = (message: any) => {
  return voiceCurrentTime.value[message.id] || 0
}

const getVoiceProgress = (message: any) => {
  const currentTime = voiceCurrentTime.value[message.id] || 0
  const duration = JSON.parse(message.media_data || '{}').duration || 0
  return duration > 0 ? (currentTime / duration) * 100 : 0
}

const seekVoiceMessage = (event: MouseEvent, message: any) => {
  if (!currentAudio.value || playingVoiceId.value !== message.id) return
  
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const duration = JSON.parse(message.media_data || '{}').duration || 0
  const newTime = duration * percentage
  
  currentAudio.value.currentTime = newTime
  voiceCurrentTime.value[message.id] = newTime
}

const startVoiceProgressTracking = (messageId: string) => {
  if (voiceProgressUpdateInterval.value) {
    clearInterval(voiceProgressUpdateInterval.value)
  }
  
  voiceProgressUpdateInterval.value = setInterval(() => {
    if (currentAudio.value && playingVoiceId.value === messageId) {
      voiceCurrentTime.value[messageId] = currentAudio.value.currentTime
    }
  }, 100) // Update every 100ms for smooth progress
}

// Voice Preview Progress Methods
const getVoicePreviewCurrentTime = () => {
  return previewCurrentTime.value
}

const getVoicePreviewProgress = () => {
  const currentTime = previewCurrentTime.value
  const duration = recordingTime.value
  return duration > 0 ? (currentTime / duration) * 100 : 0
}

const seekVoicePreview = (event: MouseEvent) => {
  if (!previewAudio.value) return
  
  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const duration = recordingTime.value
  const newTime = duration * percentage
  
  previewAudio.value.currentTime = newTime
  previewCurrentTime.value = newTime
}

const startPreviewProgressTracking = () => {
  if (previewProgressUpdateInterval.value) {
    clearInterval(previewProgressUpdateInterval.value)
  }
  
  previewProgressUpdateInterval.value = setInterval(() => {
    if (previewAudio.value && isPlayingPreview.value) {
      previewCurrentTime.value = previewAudio.value.currentTime
    }
  }, 100) // Update every 100ms for smooth progress
}

// Photo Methods
const handlePhotoSelection = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  selectedPhotos.value = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    if (!file.type.startsWith('image/')) {
      console.warn(`"${file.name}" is not a valid image file.`)
      continue
    }
    
    if (file.size > 5 * 1024 * 1024) {
      console.warn(`"${file.name}" is too large. Please choose an image smaller than 5MB.`)
      continue
    }
    
    let processedFile = file
    
    if (file.type === 'image/heic' || file.type === 'image/heif' || 
        file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      try {
        processedFile = await convertHeicToJpeg(file)
        console.log(`✅ Converted HEIC file "${file.name}" to JPEG`)
      } catch (error) {
        console.error(`❌ Failed to convert HEIC file "${file.name}":`, error)
        continue
      }
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedPhotos.value.push({
        file: processedFile,
        preview: e.target?.result as string
      })
    }
    reader.readAsDataURL(processedFile)
  }
}

const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    console.log('Converting HEIC file to JPEG:', file.name)
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    }) as Blob
    
    const convertedFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
    const convertedFile = new File([convertedBlob], convertedFileName, {
      type: 'image/jpeg',
      lastModified: Date.now()
    })
    
    console.log(`✅ HEIC conversion successful: ${file.name} -> ${convertedFileName}`)
    return convertedFile
    
  } catch (error) {
    console.error('❌ HEIC conversion failed:', error)
    throw new Error(`Failed to convert HEIC file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const removePhoto = (index: number) => {
  selectedPhotos.value.splice(index, 1)
}

const openPhotoViewer = (photoUrl: string) => {
  window.open(photoUrl, '_blank')
}

const sendPhotos = async () => {
  const hasRequiredId = isSupportGroupChat.value ? !!groupId.value : !!topicId.value
  
  console.log('📸 sendPhotos called with:', {
    selectedPhotosCount: selectedPhotos.value.length,
    currentUserId: currentUserId.value,
    topicId: topicId.value,
    groupId: groupId.value,
    hasRequiredId,
    isAuthenticated: isAuthenticated.value,
    isUserInCommunity: isUserInCommunity.value
  })
  
  if (selectedPhotos.value.length === 0 || !currentUserId.value || !hasRequiredId) {
    console.log('❌ Early return from sendPhotos:', {
      hasPhotos: selectedPhotos.value.length > 0,
      hasUserId: !!currentUserId.value,
      hasTopicId: !!topicId.value,
      hasGroupId: !!groupId.value,
      hasRequiredId
    })
    return
  }
  
  try {
    if (!isAuthenticated.value || !isUserInCommunity.value) {
      console.log('❌ Authentication/membership check failed:', {
        isAuthenticated: isAuthenticated.value,
        isUserInCommunity: isUserInCommunity.value
      })
      return
    }

    sendingMessage.value = true
    console.log('📸 Setting sendingMessage to true')
    
    console.log('📸 Starting photo upload process...', selectedPhotos.value.length, 'photos')
    
    const uploadPromises = selectedPhotos.value.map(photo => 
      uploadPhoto(photo.file, currentUserId.value!, isSupportGroupChat.value ? groupId.value! : topicId.value!)
    )
    
    const uploadResults = await Promise.all(uploadPromises)
    console.log('📸 Upload results:', uploadResults)
    
    const failedUploads = uploadResults.filter((result: any) => result.error)
    if (failedUploads.length > 0) {
      console.error('❌ Upload failures:', failedUploads)
      throw new Error(`Failed to upload ${failedUploads.length} photo(s): ${failedUploads.map((f: any) => f.error).join(', ')}`)
    }
    
    console.log('✅ All photos uploaded, saving to database...')
    
    const photoUrls = uploadResults.map((result: any) => result.url).filter(Boolean)
    const photoPaths = uploadResults.map((result: any) => result.path).filter(Boolean)
    
    console.log('📸 Photo URLs:', photoUrls)
    console.log('📸 Photo paths:', photoPaths)
    
    const messageData = {
      content: `[${selectedPhotos.value.length} Photo${selectedPhotos.value.length > 1 ? 's' : ''}]`,
      sender_id: currentUserId.value,
      message_type: 'photo',
      media_url: photoUrls[0],
      media_data: JSON.stringify({
        photo_count: selectedPhotos.value.length,
        photo_urls: photoUrls,
        photo_paths: photoPaths,
        photos: selectedPhotos.value.map((p, index) => ({
          name: p.file.name,
          size: p.file.size,
          type: p.file.type,
          url: photoUrls[index],
          path: photoPaths[index]
        })),
        placeholder: false
      }),
      created_at: new Date().toISOString(),
      // Set ONLY the appropriate ID based on chat type
      ...(isSupportGroupChat.value 
        ? { support_group_id: groupId.value }
        : { topic_id: topicId.value }
      )
    }
    
    console.log('📸 Inserting message data:', messageData)
    
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      throw error
    }

    console.log('✅ Photo message saved to database:', data)

    const messageWithUser = {
      ...data,
      user: {
        id: currentUserId.value,
        name: currentUser.value?.name || 'You',
        avatar: currentUser.value?.avatar
      }
    }
    console.log('📸 Adding message to local array:', messageWithUser)
    messages.value.push(messageWithUser)

    console.log('📸 Cleaning up and closing modal')
    selectedPhotos.value = []
    showPhotoGallery.value = false
    showToastMessage('Photos sent!', 'success')
    
    await nextTick()
    immediateScrollToBottom()
    scrollToBottom()

  } catch (error) {
    console.error('❌ Error sending photos:', error)
    showToastMessage(`Failed to send photos: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
  } finally {
    console.log('📸 Setting sendingMessage to false')
    sendingMessage.value = false
  }
}

const loadMembers = async () => {
  loadingMembers.value = true
  try {
    if (isSupportGroupChat.value) {
      console.log('🔍 Loading support group members for group:', groupId.value)
      
      // Test users table access first
      const { data: testUsers, error: testError } = await supabase
        .from('users')
        .select('id, name, email')
        .limit(3)
      
      console.log('🔍 Test users query:', { testUsers, testError })
      
      // First, get the member data without join
      const { data: membersData, error: membersError } = await supabase
        .from('support_group_members')
        .select('user_id, role, joined_at')
        .eq('support_group_id', groupId.value)
        .is('left_at', null)

      if (membersError) {
        console.error('❌ Error loading support group members:', membersError)
        showToastMessage('Failed to load support group members', 'error')
        members.value = []
        return
      }

      console.log('🔍 Found support group members:', membersData)

      if (!membersData || membersData.length === 0) {
        console.log('📝 No members found for this group')
        members.value = []
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(membersData.map((m: any) => m.user_id))]
      console.log('🔍 Fetching user details for IDs:', userIds)

      // Fetch user details using admin client to bypass RLS
      console.log('🔍 About to query users table with IDs using ADMIN CLIENT:', userIds)
      
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          name,
          email,
          avatar
        `)
        .in('id', userIds)

      console.log('📊 User query result:', { usersData, usersError, queryIds: userIds })
      console.log('📊 Raw usersData:', JSON.stringify(usersData, null, 2))
      
      // Test admin access
      const { data: testUsersData, error: testUsersError } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .limit(10)
      
      console.log('📊 Test ADMIN users query:', { testUsersData, testUsersError })

      if (usersError) {
        console.error('❌ Error fetching user details:', usersError)
        showToastMessage('Failed to load user details', 'error')
        members.value = []
        return
      }

      console.log('🔍 Found user details:', usersData)

      // Combine member data with user details
      members.value = membersData.map((member: any) => {
        const userDetail = usersData?.find((user: any) => user.id === member.user_id)
        console.log('🔍 Processing member:', { 
          member_user_id: member.user_id, 
          member_user_id_type: typeof member.user_id,
          userDetail_id: userDetail?.id,
          userDetail_name: userDetail?.name,
          userDetail_email: userDetail?.email,
          found_match: !!userDetail,
          available_user_ids: usersData?.map((u: any) => u.id),
          exact_id_match: usersData?.some((u: any) => u.id === member.user_id),
          full_userDetail: userDetail
        })
        
        // More robust name handling
        let displayName = 'Unknown User'
        if (userDetail?.name) {
          displayName = userDetail.name
        } else if (userDetail?.email) {
          // Use email prefix if name is not available
          displayName = userDetail.email.split('@')[0]
        } else if (member.user_id) {
          // Last resort: use partial UUID
          displayName = `User ${member.user_id.slice(0, 8)}`
        }
        
        return {
          id: member.user_id,
          user_id: member.user_id, // Also include user_id for compatibility
          name: displayName, // Keep direct name for GroupChatView template
          email: userDetail?.email || '',
          avatar: userDetail?.avatar || null,
          role: member.role || 'member',
          joined_at: member.joined_at,
          online: Math.random() > 0.5, // Placeholder for online status
          // Add nested user object for ChatsView compatibility
          user: {
            id: member.user_id,
            name: displayName,
            email: userDetail?.email || '',
            avatar: userDetail?.avatar || null
          }
        }
      })

      console.log('✅ Processed members:', members.value)
    } else {
      // For regular community topics
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          user_id,
          role,
          joined_at,
          users!user_id (
            id,
            name,
            avatar,
            email
          )
        `)
        .eq('community_id', communityId.value)

      if (error) {
        console.error('❌ Error loading community members:', error)
        showToastMessage('Failed to load members', 'error')
      } else {
        console.log('🔍 Raw community member data:', data)
        members.value = data?.map((member: any) => {
          const userData = Array.isArray(member.users) ? member.users[0] : member.users
          console.log('🔍 Processing community member:', { member, userData })
                      return {
              id: member.user_id,
              name: userData?.name || 'Unknown User',
              avatar: userData?.avatar,
              email: userData?.email,
              role: member.role,
              online: Math.random() > 0.5
            }
        }) || []
      }
    }

    console.log('✅ Members loaded:', {
      isSupportGroup: isSupportGroupChat.value,
      count: members.value.length,
      members: members.value
    })

  } catch (error) {
    console.error('❌ Error loading members:', error)
    showToastMessage('Failed to load members', 'error')
  } finally {
    loadingMembers.value = false
  }
}

const handleAvatarError = (event: Event) => {
  console.error('Avatar failed to load, falling back to default')
  const img = event.target as HTMLImageElement
  if (img) {
    img.style.display = 'none'
  }
}

const showUserProfile = (userId: string) => {
  console.log('🔍 showUserProfile called with userId:', userId, 'currentUserId:', currentUserId.value)
  if (userId && userId !== currentUserId.value) {
    selectedUserId.value = userId
    showProfilePopup.value = true
  } else {
    console.log('⚠️ Not showing profile - same user or invalid userId')
  }
}

const closeProfilePopup = () => {
  showProfilePopup.value = false
}

const handleMembersClick = () => {
  console.log('👥 Members button clicked')
  showMembersList.value = true
}

// Realtime subscriptions
let messagesSubscription: any = null
let subscriptionRetryCount = 0
const maxRetries = 3

const setupRealtimeSubscription = () => {
  const subscriptionId = isSupportGroupChat.value ? groupId.value : topicId.value
  const subscriptionType = isSupportGroupChat.value ? 'support_group_id' : 'topic_id'
  
  console.log('🔄 Setting up realtime subscription:', {
    subscriptionId,
    subscriptionType,
    isSupportGroupChat: isSupportGroupChat.value,
    groupId: groupId.value,
    topicId: topicId.value
  })
  
  if (!subscriptionId) {
    console.log('❌ Cannot setup subscription - no ID available')
    return
  }
  
  cleanupRealtimeSubscription()
  
  console.log(`🔄 Setting up real-time subscription for ${subscriptionType}:`, subscriptionId)
  
  messagesSubscription = supabase
    .channel(`${subscriptionType}-${subscriptionId}-${Date.now()}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `${subscriptionType}=eq.${subscriptionId}`
    }, async (payload) => {
      console.log('📨 New message received via realtime:', payload.new)
      
      try {
        if (payload.new.sender_id === currentUserId.value) {
          console.log('📨 Skipping own message from realtime')
          return
        }
        
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            created_at,
            message_type,
            media_url,
            media_data,
            reactions,
            topic_id,
            support_group_id,
            users!messages_sender_id_fkey (
              id,
              name,
              avatar
            )
          `)
          .eq('id', payload.new.id)
          .single()
        
        if (error) {
          console.error('❌ Error fetching message details:', error)
          return
        }
        
        if (data) {
          const existingMessage = messages.value.find(m => m.id === data.id)
          if (existingMessage) {
            console.log('📨 Message already exists, skipping duplicate')
            return
          }
          
          const userData = Array.isArray(data.users) ? data.users[0] : data.users
          const messageWithUser = {
            ...data,
            user_id: data.sender_id,
            user: userData,
            user_name: userData?.name,
            user_avatar: userData?.avatar
          }
          
          console.log('📨 Adding new message to local array:', messageWithUser)
          messages.value.push(messageWithUser)
          
          await nextTick()
          if (isNearBottom.value) {
            setTimeout(() => scrollToBottom(), 100)
          } else {
            showScrollToBottom.value = true
          }
        }
      } catch (error) {
        console.error('❌ Error processing realtime message:', error)
      }
    })
    .subscribe((status) => {
      console.log('📡 Realtime subscription status:', status)
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to realtime updates')
        subscriptionRetryCount = 0
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('❌ Realtime subscription error:', status)
        
        if (subscriptionRetryCount < maxRetries) {
          subscriptionRetryCount++
          const retryDelay = Math.pow(2, subscriptionRetryCount) * 1000
          console.log(`🔄 Retrying subscription in ${retryDelay}ms (attempt ${subscriptionRetryCount}/${maxRetries})`)
          
          setTimeout(() => {
            setupRealtimeSubscription()
          }, retryDelay)
        } else {
          console.error('❌ Max subscription retries reached, giving up')
          showToastMessage('Real-time updates unavailable. Please refresh to see new messages.', 'warning')
        }
      }
    })
}

const cleanupRealtimeSubscription = () => {
  if (messagesSubscription) {
    console.log('🔄 Cleaning up real-time subscription')
    try {
      supabase.removeChannel(messagesSubscription)
    } catch (error) {
      console.error('❌ Error cleaning up subscription:', error)
    }
    messagesSubscription = null
    subscriptionRetryCount = 0
  }
}

// Watchers
watch(
  [isAuthenticated, currentUserId, communityId],
  async ([newAuth, newUserId, newCommunityId], [oldAuth, oldUserId, oldCommunityId]) => {
    if (newAuth && newUserId && newCommunityId && 
        (newAuth !== oldAuth || newUserId !== oldUserId || newCommunityId !== oldCommunityId)) {
      console.log('🔄 Auth state changed, rechecking membership:', {
        newAuth, newUserId, newCommunityId,
        oldAuth, oldUserId, oldCommunityId
      })
      await checkMembership()
    }
  },
  { immediate: true }
)

watch(
  () => authStore.isAuthenticated,
  async (newAuthState, oldAuthState) => {
    console.log('🔄 Auth state watcher triggered:', { newAuthState, oldAuthState })
    if (newAuthState && !oldAuthState) {
      console.log('🔄 User became authenticated, initializing data...')
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (currentUserId.value) {
        await userStore.loadCurrentUser(currentUserId.value)
      }
      
      await checkMembership()
      await loadMessages()
    }
  },
  { immediate: false }
)

watch(
  () => [isUserInCommunity.value, messages.value.length],
  async () => {
    await nextTick()
    setTimeout(() => {
      immediateScrollToBottom()
    }, 100)
  },
  { immediate: false }
)

watch(voiceBlob, (newBlob) => {
  if (newBlob) {
    voiceBlobUrl.value = URL.createObjectURL(newBlob)
  } else {
    voiceBlobUrl.value = ''
  }
})

// Lifecycle
onMounted(async () => {
  console.log('🚀 GroupChatView mounted')
  console.log('🚀 Route params:', route.params)
  console.log('🚀 Support group chat?', isSupportGroupChat.value)
  console.log('🚀 Group ID:', groupId.value)
  console.log('🚀 Topic ID:', route.params.topicId)
    console.log('🚀 Initial auth state:', {
    isAuthenticated: authStore.isAuthenticated,
    userId: authStore.user?.id,
      authUser: authStore.user?.id,
      storeUser: currentUser.value?.id
    })
    
  await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))
    
    console.log('🚀 Auth state after delay:', {
    isAuthenticated: authStore.isAuthenticated,
    userId: authStore.user?.id,
      authUser: authStore.user?.id,
      storeUser: currentUser.value?.id
    })
    
      if (isAuthenticated.value) {
      if (!currentUser.value?.id && authStore.user?.id) {
        console.log('🔄 Loading user data for:', authStore.user.id)
        try {
          await userStore.loadCurrentUser(authStore.user.id)
        } catch (error) {
          console.log('❌ Error loading user data:', error)
        }
      }
      
      // Load different data based on chat type
      if (isSupportGroupChat.value) {
        await loadSupportGroup()
      } else {
        await loadTopic()
      }
      
      await checkMembership()
      
      console.log('🔍 After loading and checking membership:', {
        isSupportGroupChat: isSupportGroupChat.value,
        topicLoaded: !!topic.value,
        topicId: topicId.value,
        groupId: groupId.value,
        isUserInGroup: isUserInGroup.value
      })
      
      if (isUserInGroup.value) {
        // Both support groups and regular topics can load messages now
        const canLoadMessages = isSupportGroupChat.value ? !!groupId.value : !!topicId.value
        
        if (canLoadMessages) {
          await loadMessages()
          setupRealtimeSubscription()
          await loadMembers()
        } else {
          console.error('❌ Cannot load messages - missing required IDs')
          showToastMessage('Failed to load chat. Please try refreshing the page.', 'error')
        }
      } else {
        console.log('❌ User not in group - showing access denied')
      }
    }
})

onUnmounted(() => {
  cleanupRealtimeSubscription()
  if (previewAudio.value) {
    previewAudio.value.pause()
    previewAudio.value = null
  }
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }
  if (voiceProgressUpdateInterval.value) {
    clearInterval(voiceProgressUpdateInterval.value)
  }
  if (previewProgressUpdateInterval.value) {
    clearInterval(previewProgressUpdateInterval.value)
  }
  if (voiceBlobUrl.value) {
    URL.revokeObjectURL(voiceBlobUrl.value)
  }
})
</script>

<style scoped>
.topic-view {
  height: calc(100vh - 140px); /* Adjust for admin header and padding */
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fef3f9 0%, #f8f4f9 100%); /* PINK THEME LIKE HOMEVIEW */
  overflow: hidden;
}

.topic-header {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(220, 107, 172, 0.2);
  border-radius: 16px;
  padding: clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  box-shadow: 0 4px 20px rgba(220, 107, 172, 0.15), 0 2px 8px rgba(220, 107, 172, 0.1);
  width: calc(100% - 2rem);
  margin: 1rem;
  backdrop-filter: blur(10px);
  gap: clamp(0.5rem, 2vw, 1rem);
  min-height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 1rem);
  flex: 1;
  min-width: 0;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 0.125rem;
}

.back-btn {
  width: clamp(36px, 8vw, 40px);
  height: clamp(36px, 8vw, 40px);
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: clamp(0.9rem, 2vw, 1rem);
}

.back-btn:hover {
  background: #e9ecef;
  color: #333;
}

.topic-icon {
  width: clamp(40px, 8vw, 50px);
  height: clamp(40px, 8vw, 50px);
  background: #dc6bac;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  flex-shrink: 0;
  border: 2px solid #dc6bac;
}

.topic-details {
  flex: 1;
  min-width: 0;
  max-width: calc(100vw - 220px);
}

.topic-details h1 {
  margin: 0 0 0.25rem 0;
  color: #1a1a1a;
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  font-weight: 600;
  line-height: 1.2;
  word-wrap: break-word;
  hyphens: auto;
}

.topic-description {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: clamp(0.8rem, 1.5vw, 0.9rem);
  line-height: 1.4;
  word-wrap: break-word;
  hyphens: auto;
}

.topic-meta {
  display: flex;
  gap: clamp(0.5rem, 1.5vw, 1.5rem);
  font-size: clamp(0.75rem, 1.25vw, 0.85rem);
  color: #888;
  flex-wrap: wrap;
  align-items: center;
}

.topic-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.member-count-header {
  color: #dc6bac !important;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: clamp(0.25rem, 0.75vw, 0.5rem);
  align-items: stretch;
}

.action-btn {
  padding: clamp(0.375rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 1rem);
  background: #f8f9fa;
  color: #dc6bac;
  border: 1px solid #dc6bac;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.25rem, 0.75vw, 0.5rem);
  font-size: clamp(0.75rem, 1.25vw, 0.9rem);
  font-weight: 500;
  min-width: clamp(80px, 18vw, 100px);
  position: relative;
  white-space: nowrap;
}

.action-btn:hover {
  background: #dc6bac;
  color: white;
  border-color: #dc6bac;
  transform: translateY(-1px);
}

.action-btn:active {
  transform: translateY(0);
}

.btn-text {
  display: inline;
}

.btn-badge {
  background: #dc6bac;
  color: white;
  font-size: clamp(0.65rem, 1vw, 0.7rem);
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  margin-left: auto;
}

.action-btn:hover .btn-badge {
  background: white;
  color: #dc6bac;
}

/* Mobile responsive adjustments */
@media screen and (max-width: 768px) {
  .topic-header {
    padding: 0.75rem 1rem;
    min-height: 60px;
    margin: 0.5rem;
    width: calc(100% - 1rem);
  }
  
  .header-left {
    gap: 0.5rem;
    flex: 1;
  }
  
  .topic-details {
    max-width: calc(100vw - 160px);
  }
  
  .topic-details h1 {
    font-size: 1.1rem;
    line-height: 1.2;
  }
  
  .topic-description {
    font-size: 0.8rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .topic-meta {
    gap: 0.5rem;
  }
  
  .action-buttons {
    gap: 0.375rem;
    min-width: 85px;
  }
  
  .action-btn {
    padding: 0.375rem 0.5rem;
    min-width: 80px;
    font-size: 0.75rem;
  }
  
  .btn-text {
    display: none;
  }
  
  .action-btn {
    justify-content: center;
    min-width: 44px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    padding: 0;
  }
  
  .btn-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #dc6bac;
    color: white;
    font-size: 0.65rem;
    padding: 0.125rem 0.25rem;
    border-radius: 8px;
    min-width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 0;
    border: 1px solid white;
  }
  
  .action-btn:hover .btn-badge {
    background: white;
    color: #dc6bac;
    border-color: #dc6bac;
  }
}

@media screen and (max-width: 480px) {
  .topic-header {
    padding: 0.5rem 0.75rem;
    min-height: 50px;
    margin: 0.25rem;
    width: calc(100% - 0.5rem);
  }
  
  .header-left {
    gap: 0.375rem;
  }
  
  .topic-icon {
    width: 36px;
    height: 36px;
    font-size: 1.25rem;
  }
  
  .back-btn {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  
  .topic-details {
    max-width: calc(100vw - 140px);
  }
  
  .topic-details h1 {
    font-size: 1rem;
  }
  
  .topic-description {
    font-size: 0.75rem;
  }
  
  .topic-meta span {
    font-size: 0.7rem;
  }
  
  .action-buttons {
    gap: 0.25rem;
  }
  
  .action-btn {
    width: 40px;
    height: 40px;
    font-size: 0.85rem;
  }
  
  .btn-badge {
    font-size: 0.6rem;
    padding: 0.0625rem 0.1875rem;
    min-width: 14px;
    height: 14px;
  }
}

/* Legacy support for old class names */
.members-btn, .settings-btn {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  color: #dc6bac;
  border: 1px solid #dc6bac;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.members-btn:hover, .settings-btn:hover {
  background: #dc6bac;
  color: white;
  border-color: #dc6bac;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  margin: 0;
  padding: 0;
  min-height: 500px; /* MINIMUM HEIGHT FOR BETTER UX */
}

/* Standalone view height */
.topic-view:not(.embedded) .chat-container {
  height: calc(100vh - 200px); /* Adjusted for admin header */
}

/* Embedded view height */
.topic-view.embedded .chat-container {
  height: 100%; /* Use full available height in embedded mode */
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: transparent; /* TRANSPARENT TO SHOW PINK GRADIENT */
  min-height: 0;
  width: 100%;
  margin: 0;
  scroll-behavior: smooth;
  height: calc(100vh - 300px); /* FIXED HEIGHT TO STRETCH TO INPUT BOX */
  margin-bottom: 0; /* NO MARGIN - LET IT STRETCH TO INPUT */
}

@media (max-width: 768px) {
  .messages-container {
    padding: 1rem 1rem 2rem 1rem;
    height: calc(100vh - 200px) !important; /* MOBILE HEIGHT */
    margin-bottom: 0 !important; /* NO MARGIN ON MOBILE */
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  color: #666;
}

.empty-messages {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-messages i {
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 1rem;
  display: block;
}

.empty-messages h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin: 0;
  padding: 0;
}

.message-item {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

/* Own message styling (current user's messages) */
.message-item.own-message .message-content {
  background: linear-gradient(135deg, #dc6bac 0%, #c85499 100%);
  color: white;
  border: 1px solid rgba(220, 107, 172, 0.3);
  box-shadow: 0 3px 10px rgba(220, 107, 172, 0.25);
}

.message-item.own-message .message-content:hover {
  box-shadow: 0 5px 15px rgba(220, 107, 172, 0.35);
}

.message-item.own-message .message-header .message-author {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 700;
}

.message-item.own-message .message-header .message-time {
  color: rgba(255, 255, 255, 0.75);
}

.message-item.own-message .message-text {
  color: #ffffff;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-avatar:hover {
  transform: scale(1.05);
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Default message styling (other people's messages) */
.message-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  max-width: 60%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  position: relative;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
}

.message-content:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  gap: 0.75rem;
}

.message-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.message-author {
  font-weight: 600;
  font-size: 0.8rem;
  color: #4a5568;
  cursor: pointer;
  transition: color 0.2s ease;
}

.message-author:hover {
  color: #dc6bac;
}

.message-time {
  font-size: 0.75rem;
  color: #a0aec0;
  white-space: nowrap;
  opacity: 0.8;
}

.delete-message-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.8rem;
  opacity: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.delete-message-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  transform: scale(1.1);
}

.message-item:hover .delete-message-btn {
  opacity: 1;
}

.message-text {
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
  color: #2d3748;
  font-size: 0.875rem;
}

.message-voice {
  margin-top: 0.5rem;
}

/* Voice message styling (other people's messages) */
.voice-message-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(74, 85, 104, 0.85) 0%, rgba(45, 55, 72, 0.9) 100%);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1);
  max-width: 320px;
  min-height: 60px;
}

.voice-message-container:hover {
  background: linear-gradient(135deg, rgba(74, 85, 104, 0.9) 0%, rgba(45, 55, 72, 0.95) 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

/* Voice message styling for own messages */
.message-item.own-message .voice-message-container {
  background: linear-gradient(135deg, rgba(220, 107, 172, 0.15) 0%, rgba(220, 107, 172, 0.25) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(220, 107, 172, 0.15), 0 0 0 1px rgba(220, 107, 172, 0.2);
}

.message-item.own-message .voice-message-container:hover {
  background: linear-gradient(135deg, rgba(220, 107, 172, 0.25) 0%, rgba(220, 107, 172, 0.35) 100%);
  box-shadow: 0 4px 12px rgba(220, 107, 172, 0.25);
}

/* Voice play button (other people's messages) */
.voice-play-button {
  width: 40px;
  height: 40px;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a5568;
  font-size: 1rem;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.voice-play-button:hover {
  background: #f7fafc;
  color: #2d3748;
  transform: scale(1.05);
}

/* Voice play button for own messages */
.message-item.own-message .voice-play-button {
  background: #dc6bac;
  box-shadow: 0 3px 8px rgba(220, 107, 172, 0.3);
}

.message-item.own-message .voice-play-button:hover {
  background: #c85499;
}

.voice-play-button i {
  margin-left: 2px;
}

.voice-progress-container {
  margin-top: 0.25rem;
  width: 100%;
}

/* Voice progress (other people's messages) */
.voice-progress-bar {
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.voice-progress-fill {
  height: 100%;
  background: #ffffff;
  border-radius: 3px;
  transition: width 0.1s ease;
}

.voice-progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
  transition: left 0.1s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.voice-progress-handle:hover {
  transform: translate(-50%, -50%) scale(1.2);
}

.voice-time-display {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #ffffff;
}

.voice-current-time {
  font-weight: 600;
  color: #ffffff;
}

.voice-total-time {
  color: rgba(255, 255, 255, 0.8);
}

/* Voice progress for own messages */
.message-item.own-message .voice-progress-bar {
  background: rgba(255, 255, 255, 0.3);
}

.message-item.own-message .voice-progress-fill {
  background: #ffffff;
}

.message-item.own-message .voice-progress-handle {
  background: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.message-item.own-message .voice-time-display {
  color: #ffffff;
}

.message-item.own-message .voice-current-time {
  color: #ffffff;
}

.message-item.own-message .voice-total-time {
  color: rgba(255, 255, 255, 0.8);
}

.voice-info {
  flex: 1;
  min-width: 0;
}

.voice-duration {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
}

/* Voice label and badge (other people's messages) */
.voice-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
  flex: 1;
}

.voice-time-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.375rem 0.75rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

/* Voice label and badge for own messages */
.message-item.own-message .voice-label {
  color: #ffffff;
}

.message-item.own-message .voice-time-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.message-gif {
  margin-top: 0.5rem;
}

.gif-image {
  max-width: 100%;
  border-radius: 8px;
  cursor: pointer;
}

.message-photos {
  margin-top: 0.5rem;
}

.photos-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.photo-item-display {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(220, 107, 172, 0.1);
}

.photo-item-display:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(220, 107, 172, 0.3);
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  aspect-ratio: 1;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  background: #f8f9fa;
}

.photo-placeholder i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.photos-info {
  font-size: 0.8rem;
  color: #666;
}

.placeholder-note {
  color: #999;
  font-style: italic;
}

/* MESSAGE INPUT CONTAINER - EMBEDDED COMPATIBLE */
.message-input-container {
  background: rgba(255, 255, 255, 0.95) !important;
  border-top: 2px solid #dc6bac !important;
  padding: 1rem !important;
  flex-shrink: 0;
  box-shadow: 0 -4px 20px rgba(220, 107, 172, 0.2) !important;
  z-index: 1000 !important;
  display: block !important;
  min-height: 80px !important;
  visibility: visible !important;
  opacity: 1 !important;
  backdrop-filter: blur(10px) !important;
  border-radius: 16px 16px 0 0 !important;
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  margin: 0 !important;
}

/* When embedded in ChatsView - position within chat content panel only */
.topic-view.embedded .message-input-container {
  position: fixed !important;
  bottom: 70px !important; /* Above bottom nav */
  left: 680px !important; /* Main sidebar (280px) + chat sidebar (400px) */
  right: 0 !important;
  width: auto !important;
  max-width: calc(100% - 680px) !important;
}

/* Mobile adjustments - no sidebars on mobile */
@media (max-width: 768px) {
  .message-input-container {
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    padding: 0.75rem 1rem;
    border-radius: 0 !important;
  }
  
  .topic-view.embedded .message-input-container {
    position: fixed !important;
    bottom: 80px !important; /* Mobile bottom nav height */
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}

/* When main sidebar is collapsed */
@media (min-width: 769px) {
  .chats-view.sidebar-collapsed .topic-view.embedded .message-input-container {
    left: 470px !important; /* Collapsed sidebar (70px) + chat sidebar (400px) */
    max-width: calc(100% - 470px) !important;
  }
}

.message-form {
  width: 100%;
  margin: 0;
}

.input-wrapper {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.media-btn, .mic-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 1.1rem;
}

.media-btn {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #666;
  border: 2px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.media-btn:hover, .media-btn.active {
  background: linear-gradient(135deg, #dc6bac 0%, #c85499 100%);
  color: white;
  border-color: #dc6bac;
  transform: rotate(45deg);
  box-shadow: 0 4px 8px rgba(220, 107, 172, 0.25);
}

.mic-btn {
  background: #FF3B30;
  color: white;
  position: relative;
  overflow: hidden;
}

.mic-btn:hover:not(:disabled) {
  background: #dc3545;
  transform: scale(1.05);
}

.mic-btn.recording {
  animation: pulse 1.5s infinite;
  background: #FF3B30;
}

.mic-btn.has-voice {
  background: #34C759;
  color: white;
}

.mic-btn.has-voice:hover:not(:disabled) {
  background: #28a745;
}

.mic-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.voice-input-preview {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  border: 2px solid #dc6bac;
  border-radius: 24px;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(220, 107, 172, 0.1) 0%, rgba(220, 107, 172, 0.05) 100%);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(220, 107, 172, 0.2);
  animation: pulse-preview 2s infinite;
  overflow: hidden;
}

@keyframes pulse-preview {
  0%, 100% { 
    border-color: #dc6bac;
    box-shadow: 0 4px 12px rgba(220, 107, 172, 0.2);
  }
  50% { 
    border-color: #c85499;
    box-shadow: 0 6px 16px rgba(220, 107, 172, 0.3);
  }
}

.voice-preview-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.voice-preview-display > i {
  color: #dc6bac;
  font-size: 1.1rem;
  animation: pulse-mic 1.5s infinite;
  flex-shrink: 0;
}

@keyframes pulse-mic {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.voice-preview-info {
  flex: 1;
  min-width: 0;
}

.voice-preview-info > span {
  color: #dc6bac;
  font-weight: 600;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.5rem;
}

.voice-preview-progress {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.voice-preview-progress-bar {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 4px;
  background: rgba(220, 107, 172, 0.2);
  border-radius: 2px;
  cursor: pointer;
  margin-bottom: 0.3rem;
  overflow: hidden;
}

.voice-preview-progress-fill {
  height: 100%;
  background: #dc6bac;
  border-radius: 2px;
  transition: width 0.1s ease;
}

.voice-preview-progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #dc6bac;
  border: 1px solid white;
  border-radius: 50%;
  cursor: pointer;
  transition: left 0.1s ease;
}

.voice-preview-time-display {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #666;
}

.voice-preview-current-time {
  font-weight: 600;
  color: #dc6bac;
}

.voice-preview-total-time {
  color: #888;
}

.voice-preview-controls {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Recording Input Display */
.recording-input-display {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  border: 2px solid #FF3B30;
  border-radius: 24px;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 59, 48, 0.05) 100%);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
  animation: pulse-recording 2s infinite;
}

@keyframes pulse-recording {
  0%, 100% { 
    border-color: #FF3B30;
    box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
  }
  50% { 
    border-color: #ff6b5a;
    box-shadow: 0 6px 16px rgba(255, 59, 48, 0.3);
  }
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.recording-mic-icon {
  color: #FF3B30;
  font-size: 1.1rem;
  animation: pulse-mic-recording 1s infinite;
}

@keyframes pulse-mic-recording {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.recording-status {
  color: #FF3B30;
  font-weight: 600;
  font-size: 0.9rem;
  flex: 1;
}

.recording-timer {
  color: #FF3B30;
  font-weight: 700;
  font-size: 1.1rem;
  background: rgba(255, 59, 48, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 59, 48, 0.2);
}

.recording-instruction {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  opacity: 0.8;
}

.mini-play-btn, .mini-delete-btn {
  width: 36px;
  height: 36px;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.9rem;
  font-weight: 600;
}

.mini-play-btn {
  background: #dc6bac;
  color: white;
  box-shadow: 0 3px 8px rgba(220, 107, 172, 0.4);
}

.mini-play-btn:hover {
  background: #c85499;
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(220, 107, 172, 0.5);
}

.mini-play-btn.playing {
  background: #34C759;
  color: white;
  animation: pulse 1.5s infinite;
  border-color: #34C759;
  box-shadow: 0 3px 8px rgba(52, 199, 89, 0.4);
}

.mini-delete-btn {
  background: #ff4757;
  color: white;
  box-shadow: 0 3px 8px rgba(255, 71, 87, 0.4);
}

.mini-delete-btn:hover {
  background: #ff3838;
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.5);
}

.input-wrapper textarea {
  flex: 1;
  border: 2px solid rgba(220, 107, 172, 0.2);
  border-radius: 24px;
  padding: 0.875rem 1.25rem;
  font-size: 1rem;
  resize: none;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
  line-height: 1.5;
  min-height: 48px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(220, 107, 172, 0.1);
  backdrop-filter: blur(5px);
  overflow: hidden;
}

.input-wrapper textarea:focus {
  border-color: #dc6bac;
  box-shadow: 0 0 0 3px rgba(220, 107, 172, 0.2), 0 2px 12px rgba(220, 107, 172, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

.send-btn {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #dc6bac 0%, #c85499 100%);
  color: white;
  border: 2px solid #dc6bac;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(220, 107, 172, 0.25);
  font-size: 1.1rem;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c85499 0%, #b04789 100%);
  border-color: #c85499;
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(220, 107, 172, 0.35);
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.join-prompt-inline {
  text-align: center;
  padding: 1rem 0 0 0;
}

.join-btn-inline {
  padding: 0.5rem 1.5rem;
  background: #dc6bac;
  color: white;
  border: 2px solid #dc6bac;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.join-btn-inline:hover:not(:disabled) {
  background: #c85499;
  color: white;
  border-color: #c85499;
}

.join-btn-inline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scroll-to-bottom-btn {
  position: fixed;
  bottom: 100px; /* ABOVE MESSAGE INPUT CONTAINER */
  right: 2rem;
  width: 48px;
  height: 48px;
  background: rgba(220, 107, 172, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  z-index: 100;
}

.scroll-to-bottom-btn:hover {
  background: rgba(220, 107, 172, 1);
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .scroll-to-bottom-btn {
    bottom: 100px; /* ABOVE MESSAGE INPUT CONTAINER ON MOBILE */
    right: 16px;
    width: 44px;
    height: 44px;
  }
}



.not-found {
  text-align: center;
  padding: 4rem;
  color: #666;
}

.not-found i {
  font-size: 4rem;
  color: #ff6b6b;
  margin-bottom: 1rem;
  display: block;
}

.not-found h2 {
  color: #333;
  margin-bottom: 1rem;
}

.not-found p {
  margin-bottom: 2rem;
  font-size: 1.1rem;
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

.modal {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 1.3rem;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.modal-content {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  margin: 2rem;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(220, 107, 172, 0.1);
}

.empty-state i {
  font-size: 3rem;
  color: rgba(220, 107, 172, 0.5);
  margin-bottom: 1rem;
  display: block;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.member-role {
  font-size: 0.8rem;
  color: #888;
}

.member-joined {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

.member-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.message-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #dc6bac;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(220, 107, 172, 0.25);
}

.message-btn:hover {
  background: #c85499;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(220, 107, 172, 0.35);
}

.message-btn:active {
  transform: scale(0.95);
}

.member-status {
  display: flex;
  align-items: center;
    gap: 0.5rem;
  }

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #22c55e;
}

.status-indicator.offline {
  background: #dc3545;
}

/* Media Menu */
.media-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center; /* CENTER INSTEAD OF FLEX-END */
  justify-content: center;
  z-index: 2000; /* HIGHER THAN MESSAGE INPUT */
  padding: 1rem;
}

.media-menu {
  background: white;
  border-radius: 16px; /* ROUNDED ALL CORNERS */
  width: 100%;
  max-width: 400px; /* SMALLER MAX WIDTH */
  max-height: 60vh;
  overflow: hidden;
  animation: fadeIn 0.3s ease-out; /* DIFFERENT ANIMATION */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

@keyframes fadeIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.media-menu-header {
  padding: 2rem 2rem 1.5rem 2rem; /* INCREASED PADDING */
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa; /* LIGHT BACKGROUND */
}

.media-menu-header h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 1.4rem; /* SLIGHTLY LARGER */
  font-weight: 700; /* BOLDER */
}

.close-menu-btn {
  width: 36px; /* SLIGHTLY LARGER */
  height: 36px;
  border: none;
  background: #e9ecef;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s;
  font-size: 1.1rem;
}

.close-menu-btn:hover {
  background: #dc6bac;
  color: white;
  transform: scale(1.1);
}

.media-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem; /* INCREASED GAP */
  padding: 2rem 1.5rem 2.5rem 1.5rem; /* ADJUSTED PADDING */
}

.media-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem; /* INCREASED GAP */
  padding: 1.5rem 1rem; /* INCREASED PADDING */
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8f9fa;
  border: 2px solid transparent;
}

.media-option:hover {
  background: #e9ecef;
  border-color: #dc6bac;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 107, 172, 0.2);
}

.media-icon {
  width: 70px; /* LARGER ICONS */
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem; /* LARGER FONT SIZE */
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.media-icon.photos { background: #007AFF; }
.media-icon.camera { background: #34C759; }
.media-icon.gif { background: #FF6B35; } /* ORANGE FOR GIF */

.media-option span {
  font-size: 1rem; /* LARGER TEXT */
  color: #333;
  font-weight: 600; /* BOLDER TEXT */
  text-align: center;
}

/* GIPHY Modal */
.giphy-modal-overlay {
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

.giphy-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.giphy-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.giphy-header h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 1.3rem;
  font-weight: 600;
}

.giphy-search {
  padding: 1rem 2rem;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.giphy-search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.giphy-search-input:focus {
  border-color: #dc6bac;
  box-shadow: 0 0 0 3px rgba(220, 107, 172, 0.1);
}

.giphy-results {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.giphy-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  color: #666;
}

.giphy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.giphy-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.giphy-item:hover {
  transform: scale(1.05);
}

.giphy-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Photo Gallery Modal */
.photo-modal-overlay {
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

.photo-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.photo-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.photo-header h3 {
  margin: 0;
  color: #1a1a1a;
  font-size: 1.3rem;
  font-weight: 600;
}

.photo-upload-area {
  padding: 2rem;
  flex-shrink: 0;
}

.file-info {
  margin-bottom: 1rem;
}

.file-info small {
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.file-info .fas {
  color: #dc6bac;
}

.upload-prompt {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-prompt:hover {
  border-color: #dc6bac;
  background: rgba(220, 107, 172, 0.05);
}

.upload-prompt i {
  font-size: 3rem;
  color: #dc6bac;
  margin-bottom: 1rem;
  display: block;
}

.upload-prompt p {
  color: #666;
  margin: 0;
  font-size: 1.1rem;
}

.selected-photos {
  flex: 1;
  overflow-y: auto;
  padding: 0 2rem 2rem 2rem;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.remove-photo-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}

.photo-actions {
  display: flex;
  justify-content: center;
}

.send-photos-btn {
  padding: 0.75rem 2rem;
  background: #dc6bac;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.send-photos-btn:hover {
  background: #c85499;
}

/* Toast Styles */
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1001;
  min-width: 300px;
  border-left: 4px solid #dc6bac;
  animation: slideIn 0.3s ease-out;
}

.toast.success {
  border-left-color: #22c55e;
  color: #22c55e;
}

.toast.error {
  border-left-color: #ef4444;
  color: #ef4444;
}

.toast.warning {
  border-left-color: #f59e0b;
  color: #f59e0b;
}

.toast.info {
  border-left-color: #dc6bac;
  color: #dc6bac;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .topic-header {
    padding: 0.875rem 1rem;
    margin: 0.75rem;
    width: calc(100% - 1.5rem);
    border-radius: 12px;
  }

  .topic-info {
    gap: 0.5rem;
  }

  .topic-details h1 {
    font-size: 1.1rem;
  }

  .topic-meta {
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8rem;
  }

  .messages-container {
    padding: 0.5rem;
  }

  .messages-list {
  gap: 0.75rem;
}

  .message-content {
    max-width: 85%;
  }

  .modal {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .modal-content {
    padding: 1rem;
  }

  .toast {
    right: 1rem;
    left: 1rem;
    min-width: auto;
  }

  .recording-indicator-overlay {
    width: 100px;
    height: 100px;
    font-size: 2.5rem;
  }
  
  .recording-time-overlay {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .topic-header {
    padding: 0.75rem;
  }

  .topic-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .topic-details h1 {
    font-size: 1.1rem;
  }

  .message-content {
    max-width: 90%;
    padding: 0.5rem 0.75rem;
  }

  .input-wrapper textarea {
    padding: 0.5rem 0.75rem;
  }

  .send-btn {
    width: 40px;
    height: 40px;
  }
}

/* Mobile responsive for media menu */
@media (max-width: 768px) {
  .media-menu {
    max-width: 90vw;
    margin: 0 1rem;
  }
  
  .media-options {
    gap: 1rem;
    padding: 1.5rem 1rem 2rem 1rem;
  }
  
  .media-option {
    padding: 1rem 0.5rem;
  }
  
  .media-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .media-option span {
    font-size: 0.9rem;
  }
  
  .media-menu-header {
    padding: 1.5rem 1rem 1rem 1rem;
  }
  
  .media-menu-header h3 {
    font-size: 1.2rem;
  }
}
</style> 