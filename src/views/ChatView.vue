<template>
  <div class="chat-view" :class="{ embedded: isEmbedded }">
    <!-- Chat Header -->
    <div v-if="!isEmbedded" class="chat-header">
      <div class="header-left">
        <button v-if="!isEmbedded" @click="goBack" class="back-btn">
          <i class="fas fa-arrow-left"></i>
        </button>
        <img 
          v-if="otherUser?.avatar"
          :src="otherUser.avatar" 
          :alt="otherUser.name"
          class="header-avatar"
          @error="handleAvatarError"
        >
        <DefaultAvatar 
          v-else
          :size="40" 
          :fontSize="16"
          class="header-avatar"
        />
        <div class="user-details">
          <h1>{{ otherUser?.name || 'Unknown User' }}</h1>
          <!-- Debug info -->
          <div v-if="!otherUser" style="font-size: 0.8rem; color: #999;">
            Debug: conversationId={{ conversationId }}, hasCurrentConv={{ !!currentConversation }}, loading={{ loading }}
            <br>Store conversations: {{ directMessagesStore.conversations.length }}
            <br>Available conversations: {{ directMessagesStore.conversations.map(c => c.id).join(', ') }}
          </div>
        </div>
      </div>
    </div>

    <div class="chat-container">
      <div class="messages-container" ref="messagesContainer" @scroll="handleScroll">
        <div v-if="loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Loading messages...
        </div>
        
        <div v-else-if="!messages || messages.length === 0" class="empty-messages">
          <i class="fas fa-comments"></i>
          <h3>No messages yet</h3>
          <p>Start the conversation!</p>
        </div>

        <div v-else class="messages-list">
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message-item"
            :class="{ 'own-message': message.sender_id === authStore.user?.id }"
          >
            <div class="message-avatar" @click="showUserProfile(message.sender_id)">
              <img 
                v-if="getMessageSenderAvatar(message)"
                :src="getMessageSenderAvatar(message)" 
                :alt="getMessageSenderName(message)"
                @error="handleAvatarError"
              />
              <DefaultAvatar 
                v-else
                :size="32" 
                :fontSize="12"
              />
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="message-author">
                  {{ getMessageSenderName(message) }}
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
              
              <!-- Crisis Alert Message -->
              <div v-else-if="message.message_type && (message.message_type as string) === 'crisis_alert'" class="message-crisis-alert">
                <div class="crisis-alert-header">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>Crisis Alert</span>
                </div>
                <div class="crisis-alert-content">
                  {{ message.content }}
                </div>
                <div v-if="message.media_data" class="crisis-alert-details">
                  <div class="crisis-detail" v-for="(value, key) in JSON.parse(message.media_data)" :key="String(key)">
                    <strong>{{ formatCrisisDetailKey(String(key)) }}:</strong> {{ formatCrisisDetailValue(String(key), value) }}
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
              
              <!-- Voice Message -->
              <div v-else-if="message.message_type === 'voice'" class="message-voice">
                <div class="voice-message-container" @click="handleVoiceMessageClick(message)">
                  <div class="voice-play-button">
                    <i :class="playingVoiceId === message.id ? 'fas fa-pause' : 'fas fa-play'"></i>
                  </div>
                  <div class="voice-info">
                    <div class="voice-duration">
                      Voice message • {{ formatRecordingTime(JSON.parse(message.media_data || '{}').duration || 0) }}
                    </div>
                    <div class="voice-progress-container">
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
                        @error="(e: any) => e.target.style.display = 'none'"
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
              
              <!-- Fallback for other message types -->
              <div v-else class="message-text">
                {{ message.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll to Bottom Button -->
      <div v-if="showScrollToBottom" class="scroll-to-bottom-btn" @click="forceScrollToBottom">
        <i class="fas fa-chevron-down"></i>
      </div>

      <!-- Message Input Container - Matching GroupChatView -->
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
              placeholder="Type your message..."
              rows="1"
              ref="messageInput"
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.enter.shift.exact="addNewLine"
              @input="adjustTextareaHeight"
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
            >
              <i v-if="isRecording" class="fas fa-stop"></i>
              <i v-else-if="voiceBlob" class="fas fa-check"></i>
              <i v-else class="fas fa-microphone"></i>
            </button>

            <!-- Send Button -->
            <button 
              type="submit" 
              class="send-btn"
              :disabled="(!newMessage.trim() && !voiceBlob) || sendingMessage"
            >
              <i class="fas fa-spinner fa-spin" v-if="sendingMessage"></i>
              <i class="fas fa-paper-plane" v-else></i>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- User Profile Popup -->
    <UserProfilePopup
      :userId="selectedUserId"
      :isVisible="showProfilePopup"
      @close="closeProfilePopup"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Props
const props = defineProps<{
  conversationId?: string
  isEmbedded?: boolean
}>()

// Emits
const emit = defineEmits<{
  back: []
}>()

import { useDirectMessagesStore, useUserStore } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { uploadVoiceMessage, uploadPhoto } from '@/utils/fileUpload'
import DefaultAvatar from '@/components/DefaultAvatar.vue'
import UserProfilePopup from '@/components/UserProfilePopup.vue'
import heic2any from 'heic2any'

const route = useRoute()
const router = useRouter()
const directMessagesStore = useDirectMessagesStore()
const userStore = useUserStore()
const authStore = useAuthStore()

const conversationId = props.conversationId || route.params.conversationId as string
const loading = ref(false)
const sendingMessage = ref(false)
const newMessage = ref('')
const messagesContainer = ref<HTMLElement>()

// User Profile Popup state
const selectedUserId = ref<string | null>(null)
const showProfilePopup = ref(false)

// Rich Media State
const showMediaMenu = ref(false)
const showGiphyPicker = ref(false)
const showVoiceRecorder = ref(false)
const showPhotoGallery = ref(false)
const isRecording = ref(false)
const recordingTime = ref(0)
const voiceBlob = ref<Blob | null>(null)
const voiceBlobUrl = ref<string | null>(null)
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

// Real-time subscription
let messagesSubscription: any = null

// Refs
const messageInput = ref<HTMLTextAreaElement>()
const photoInput = ref<HTMLInputElement>()
const giphyResultsContainer = ref<HTMLElement>()

const messages = computed(() => directMessagesStore.messages || [])
const currentConversation = computed(() => {
  console.log('🔍 Current conversation computed:', {
    storeCurrentConversation: directMessagesStore.currentConversation,
    conversationId: conversationId,
    storeConversations: directMessagesStore.conversations.length,
    manualSearch: directMessagesStore.getConversationById(conversationId || '')
  })
  return directMessagesStore.currentConversation
})

// Use the exact same logic as ChatsView - find conversation and get other_user
const conversation = computed(() => {
  if (!conversationId) return null
  return directMessagesStore.conversations.find(conv => conv.id === conversationId)
})

const otherUser = computed(() => {
  if (!conversation.value) {
    console.log('🔍 No conversation found for otherUser:', {
      conversationId,
      conversations: directMessagesStore.conversations.map(c => ({ id: c.id, other_user: c.other_user?.name }))
    })
    return { id: 'unknown', name: 'Unknown User' }
  }
  
  console.log('🔍 Found conversation for otherUser:', {
    conversationId,
    other_user: conversation.value.other_user
  })
  
  // Use the exact same logic as ChatsView line 126
  return conversation.value.other_user || { id: 'unknown', name: 'Unknown User' }
})

onMounted(async () => {
  if (authStore.isAuthenticated && authStore.user?.id) {
    await loadConversation()
  }
})

// Watch for auth changes
watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
  if (isAuthenticated && authStore.user?.id) {
    await loadConversation()
  }
})

// Watch for conversation changes
watch(() => props.conversationId, async (newConversationId) => {
  if (newConversationId && authStore.isAuthenticated && authStore.user?.id) {
    // Cleanup previous subscription
    cleanupRealtimeSubscription()
    await loadConversation()
  }
})

// Watch for route changes (when not embedded)
watch(() => route.params.conversationId, async (newConversationId) => {
  if (newConversationId && authStore.isAuthenticated && authStore.user?.id) {
    // Cleanup previous subscription
    cleanupRealtimeSubscription()
    await loadConversation()
  }
})

const loadConversation = async () => {
  if (!authStore.user?.id || !conversationId) return
  
  loading.value = true
  try {
    await directMessagesStore.loadConversations(authStore.user.id)
    
    let conversation = directMessagesStore.getConversationById(conversationId)
    
    // If conversation not found in store, try to wait a bit and reload
    if (!conversation) {
      await new Promise(resolve => setTimeout(resolve, 500))
      await directMessagesStore.loadConversations(authStore.user.id)
      conversation = directMessagesStore.getConversationById(conversationId)
    }
    
    if (conversation) {
      console.log('🔍 Setting current conversation:', conversation)
      directMessagesStore.setCurrentConversation(conversation)
      await directMessagesStore.loadMessages(conversationId, authStore.user.id)
      
      // Setup real-time subscription for this conversation
      setupRealtimeSubscription()
      
      nextTick(() => {
        scrollToBottom()
      })
    } else {
      console.error('Conversation not found:', conversationId)
      console.log('🔍 Available conversations:', directMessagesStore.conversations)
      if (!props.isEmbedded) {
        router.push('/chats')
      }
    }
  } catch (error) {
    console.error('Error loading conversation:', error)
  } finally {
    loading.value = false
  }
}

const sendMessage = async () => {
  console.log('🔍 sendMessage called:', {
    messageValue: newMessage.value,
    userId: authStore.user?.id,
    conversationId,
    sendingMessage: sendingMessage.value,
    messageLength: newMessage.value.trim().length
  })
  
  if (!newMessage.value.trim() || !authStore.user?.id || !conversationId || sendingMessage.value) {
    console.log('❌ sendMessage early return - validation failed:', {
      hasMessage: !!newMessage.value.trim(),
      messageValue: newMessage.value,
      messageTrimmed: newMessage.value.trim(),
      hasUser: !!authStore.user?.id,
      userId: authStore.user?.id,
      hasConversationId: !!conversationId,
      conversationId: conversationId,
      conversationIdType: typeof conversationId,
      notSending: !sendingMessage.value,
      sendingMessageValue: sendingMessage.value,
      propsConversationId: props.conversationId,
      routeConversationId: route.params.conversationId
    })
    return
  }
  
  sendingMessage.value = true
  const messageText = newMessage.value.trim()
  newMessage.value = ''
  
  try {
    console.log('🔍 Calling store sendMessage with:', {
      conversationId,
      userId: authStore.user.id,
      messageText,
      messageLength: messageText.length
    })
    
          const result = await directMessagesStore.sendMessage(conversationId, authStore.user.id, messageText)
    
    console.log('✅ Store sendMessage result:', result)
    
    nextTick(() => {
      scrollToBottom()
    })
    
    adjustTextareaHeight()
  } catch (error) {
    console.error('❌ Error sending message:', error)
    newMessage.value = messageText
  } finally {
    sendingMessage.value = false
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
  if (props.isEmbedded) {
    emit('back')
  } else {
    router.push('/chats')
  }
}

const handleAvatarError = (event: Event) => {
  console.error('Avatar failed to load, falling back to default')
  const img = event.target as HTMLImageElement
  if (img) {
    img.style.display = 'none'
  }
}

const setupRealtimeSubscription = () => {
  if (!conversationId || messagesSubscription) return
  
  console.log('🔄 Setting up realtime subscription for conversation:', conversationId)
  
  messagesSubscription = supabase
    .channel(`direct-messages-${conversationId}-${Date.now()}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
      filter: `conversation_id=eq.${conversationId}`
    }, async (payload) => {
      console.log('📨 New direct message received via realtime:', payload.new)
      
      try {
        // Skip own messages (they're already added locally)
        if (payload.new.sender_id === authStore.user?.id) {
          console.log('📨 Skipping own message from realtime')
          return
        }
        
        // Check if message already exists
        const existingMessage = messages.value.find(m => m.id === payload.new.id)
        if (existingMessage) {
          console.log('📨 Message already exists, skipping duplicate')
          return
        }
        
        // Process the new message
        const newMessage = {
          ...payload.new,
          created_at: new Date(payload.new.created_at)
        }
        
        console.log('📨 Adding new direct message to local array:', newMessage)
        messages.value.push(newMessage)
        
        // Scroll to bottom if user is near bottom
        await nextTick()
        if (isNearBottom.value) {
          setTimeout(() => scrollToBottom(), 100)
        } else {
          showScrollToBottom.value = true
        }
        
      } catch (error) {
        console.error('❌ Error processing realtime direct message:', error)
      }
    })
    .subscribe((status) => {
      console.log('📡 Direct messages realtime subscription status:', status)
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to direct messages realtime updates')
      } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        console.error('❌ Direct messages realtime subscription error:', status)
      }
    })
}

const cleanupRealtimeSubscription = () => {
  if (messagesSubscription) {
    console.log('🧹 Cleaning up direct messages realtime subscription')
    supabase.removeChannel(messagesSubscription)
    messagesSubscription = null
  }
}

const deleteMessage = async (messageId: string) => {
  if (!authStore.user?.id) return
  
  try {
    await directMessagesStore.deleteMessage(messageId, authStore.user.id)
  } catch (error) {
    console.error('❌ Error deleting message:', error)
  }
}

const showUserProfile = (userId: string) => {
  if (userId && userId !== authStore.user?.id) {
    selectedUserId.value = userId
    showProfilePopup.value = true
  }
}

const closeProfilePopup = () => {
  showProfilePopup.value = false
}

const getMessageSenderAvatar = (message: any) => {
  if (message.sender_id === authStore.user?.id) {
    return authStore.user?.user_metadata?.avatar_url || userStore.currentUser?.avatar
  }
  return otherUser.value?.avatar
}

const getMessageSenderName = (message: any) => {
  if (message.sender_id === authStore.user?.id) {
    return 'You'
  }
  return otherUser.value?.name || 'Unknown User'
}

// Crisis message formatting methods
const formatCrisisDetailKey = (key: string) => {
  const keyMap: { [key: string]: string } = {
    'crisis_alert_id': 'Alert ID',
    'priority': 'Priority',
    'support_types': 'Support Types',
    'client_name': 'Name',
    'phone': 'Phone',
    'location': 'Location',
    'preferred_contact_time': 'Preferred Contact Time'
  }
  return keyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const formatCrisisDetailValue = (key: string, value: any) => {
  if (key === 'support_types' && Array.isArray(value)) {
    return value.join(', ')
  }
  if (key === 'priority') {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
  return value || 'Not specified'
}

// Rich Media Methods
const openPhotoGallery = () => {
  showMediaMenu.value = false
  showPhotoGallery.value = true
}

const openCamera = async () => {
  showMediaMenu.value = false
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      showPhotoGallery.value = true
      console.log('Camera functionality coming soon! Using photo gallery instead.')
    } else {
      showPhotoGallery.value = true
      console.log('Camera not available. Using photo gallery instead.')
    }
  } catch (error) {
    console.error('Camera access error:', error)
    showPhotoGallery.value = true
    console.log('Camera access denied. Using photo gallery instead.')
  }
}

const openLocationPicker = () => {
  showMediaMenu.value = false
  console.log('Location sharing coming soon!')
}

const openContactPicker = () => {
  showMediaMenu.value = false
  console.log('Contact sharing coming soon!')
}

const openDocumentPicker = () => {
  showMediaMenu.value = false
  console.log('Document sharing coming soon!')
}

const openPollCreator = () => {
  showMediaMenu.value = false
  console.log('Poll creation coming soon!')
}

const openEventCreator = () => {
  showMediaMenu.value = false
  console.log('Event creation coming soon!')
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
  } finally {
    loadingGiphy.value = false
  }
}

const selectGiphy = async (gif: any) => {
  try {
    if (!authStore.user?.id || !conversationId) return

    sendingMessage.value = true
    
    await directMessagesStore.sendMessage(
      conversationId, 
      authStore.user.id, 
      `[GIF: ${gif.title}]`,
      'gif',
      gif.images.fixed_height.url,
      JSON.stringify({
        gif_id: gif.id,
        title: gif.title,
        url: gif.images.fixed_height.url,
        preview_url: gif.images.fixed_height_small.url
      })
    )

    showGiphyPicker.value = false
    
    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('Error sending GIF:', error)
  } finally {
    sendingMessage.value = false
  }
}

// Voice Recording Methods - Simple Click-to-Record System
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
    
    console.log(errorMessage)
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

// Voice Playback Methods
const handleVoiceMessageClick = (message: any) => {
  const mediaData = JSON.parse(message.media_data || '{}')
  
  if (mediaData.placeholder) {
    console.log('Voice playback requires file storage setup')
    return
  }
  
  if (message.media_url) {
    toggleVoicePlayback(message)
  } else {
    console.log('Voice message not available')
  }
}

const toggleVoicePlayback = async (message: any) => {
  if (!message.media_url) {
    console.log('Voice message not available')
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
    
    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      console.warn(`"${file.name}" is not a valid image file.`)
      continue
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.warn(`"${file.name}" is too large. Please choose an image smaller than 5MB.`)
      continue
    }
    
    let processedFile = file
    
    // Handle HEIC/HEIF files by converting to JPEG
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
    
    // Create preview
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
    
    // Convert HEIC to JPEG
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8 // Good quality while keeping file size reasonable
    }) as Blob
    
    // Create a new File object from the converted blob
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
  if (selectedPhotos.value.length === 0 || !auth.user?.id || !conversationId) return
  
  try {
    sendingMessage.value = true
    
    console.log('📸 Starting photo upload process...', selectedPhotos.value.length, 'photos')
    
    const uploadPromises = selectedPhotos.value.map(photo => 
      uploadPhoto(photo.file, auth.user!.id, conversationId)
    )
    
    const uploadResults = await Promise.all(uploadPromises)
    console.log('📸 Upload results:', uploadResults)
    
    const failedUploads = uploadResults.filter(result => result.error)
    if (failedUploads.length > 0) {
      console.error('❌ Upload failures:', failedUploads)
      throw new Error(`Failed to upload ${failedUploads.length} photo(s)`)
    }
    
    console.log('✅ All photos uploaded, saving to database...')
    
    const photoUrls = uploadResults.map(result => result.url).filter(Boolean)
    const photoPaths = uploadResults.map(result => result.path).filter(Boolean)
    
    await directMessagesStore.sendMessage(
      conversationId,
      auth.user.id,
      `[${selectedPhotos.value.length} Photo${selectedPhotos.value.length > 1 ? 's' : ''}]`,
      'photo',
      photoUrls[0],
      JSON.stringify({
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
      })
    )

    selectedPhotos.value = []
    showPhotoGallery.value = false
    
    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('❌ Error sending photos:', error)
  } finally {
    sendingMessage.value = false
  }
}

const closeVoiceRecorder = () => {
  showVoiceRecorder.value = false
  if (isRecording.value) {
    stopRecording()
  }
}

const formatRecordingTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const sendVoiceMessage = async () => {
  if (!voiceBlob.value || !auth.user?.id || !conversationId) return
  
  try {
    sendingMessage.value = true
    
    console.log('🎤 Starting voice message upload process...')
    
    const uploadResult = await uploadVoiceMessage(
      voiceBlob.value,
      auth.user.id,
      conversationId
    )
    
    if (uploadResult.error) {
      throw new Error(`Upload failed: ${uploadResult.error}`)
    }
    
    console.log('✅ Voice file uploaded, saving to database...')
    
    await directMessagesStore.sendMessage(
      conversationId,
      auth.user.id,
      `[Voice Message - ${formatRecordingTime(recordingTime.value)}]`,
      'voice',
      uploadResult.url,
      JSON.stringify({
        duration: recordingTime.value,
        size: voiceBlob.value.size,
        type: voiceBlob.value.type,
        file_path: uploadResult.path,
        placeholder: false
      })
    )

    deleteVoiceRecording()
    showVoiceRecorder.value = false
    
    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('❌ Error sending voice message:', error)
  } finally {
    sendingMessage.value = false
  }
}

const deleteVoiceRecording = () => {
  // Stop any preview playback
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
  
  // Clear voice data
  voiceBlob.value = null
  voiceBlobUrl.value = null
  recordingTime.value = 0
}

const playVoicePreview = async () => {
  if (!voiceBlob.value) return
  
  // Create blob URL if not exists
  if (!voiceBlobUrl.value) {
    voiceBlobUrl.value = URL.createObjectURL(voiceBlob.value)
  }
  
  if (isPlayingPreview.value) {
    // Stop current playback
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

onUnmounted(() => {
  // Cleanup real-time subscription
  cleanupRealtimeSubscription()
  
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value = null
  }
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
})
</script>

<style scoped>
/* Chat View Styles */
.chat-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.chat-header {
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

.header-avatar {
  width: clamp(36px, 8vw, 40px);
  height: clamp(36px, 8vw, 40px);
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #dc6bac;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-details h1 {
  margin: 0 0 0.25rem 0;
  color: #1a1a1a;
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  font-weight: 600;
  line-height: 1.2;
  word-wrap: break-word;
  hyphens: auto;
}

.user-status {
  margin: 0;
  color: #666;
  font-size: clamp(0.8rem, 1.5vw, 0.9rem);
  line-height: 1.4;
  word-wrap: break-word;
  hyphens: auto;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  margin: 0;
  padding: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1rem 120px 1rem;
  background: #f8f9fa;
  min-height: 0;
  width: 100%;
  margin: 0;
  scroll-behavior: smooth;
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
  color: #000000;
}

.message-item.own-message .message-header .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-item.own-message .message-header .message-author {
  color: rgba(255, 255, 255, 0.9);
}

.message-item.own-message .message-header .message-time {
  color: rgba(255, 255, 255, 0.7);
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
  gap: 1rem;
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

/* Rich Media Message Styles */
.message-gif {
  max-width: 300px;
}

.gif-image {
  width: 100%;
  border-radius: 8px;
}

.message-voice {
  min-width: 200px;
}

.voice-message-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  background: linear-gradient(135deg, rgba(220, 107, 172, 0.08) 0%, rgba(220, 107, 172, 0.12) 100%);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(220, 107, 172, 0.15), 0 0 0 1px rgba(220, 107, 172, 0.2);
  max-width: 280px;
}

.voice-message-container:hover {
  background: linear-gradient(135deg, rgba(220, 107, 172, 0.12) 0%, rgba(220, 107, 172, 0.18) 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(220, 107, 172, 0.15);
}

.voice-icon {
  width: 40px;
  height: 40px;
  background: #dc6bac;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
  border: 2px solid #dc6bac;
}

.voice-play-button {
  width: 32px;
  height: 32px;
  background: #dc6bac;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85rem;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid #dc6bac;
}

.voice-play-button:hover {
  background: #c85499;
  color: white;
  border-color: #c85499;
  transform: scale(1.05);
}

.voice-play-button i {
  margin-left: 2px; /* Slight offset for play icon to look centered */
}

.voice-progress-container {
  margin-top: 0.5rem;
  width: 100%;
}

.voice-progress-bar {
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(220, 107, 172, 0.2);
  border-radius: 3px;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.voice-progress-fill {
  height: 100%;
  background: #dc6bac;
  border-radius: 3px;
  transition: width 0.1s ease;
}

.voice-progress-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #dc6bac;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  transition: left 0.1s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.voice-progress-handle:hover {
  transform: translate(-50%, -50%) scale(1.2);
}

.voice-time-display {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #666;
}

.voice-current-time {
  font-weight: 600;
  color: #dc6bac;
}

.voice-total-time {
  color: #888;
}

.voice-duration {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #555;
}

.voice-info {
  flex: 1;
}

.voice-duration {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.voice-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.voice-waveform {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.waveform-bar {
  width: 3px;
  background: #dc6bac;
  border-radius: 2px;
  transition: height 0.1s ease;
  opacity: 0.3;
}

.waveform-bar.active {
  opacity: 1;
  animation: waveform-bounce 0.6s ease-in-out infinite alternate;
}

@keyframes waveform-bounce {
  0% { transform: scaleY(0.5); }
  100% { transform: scaleY(1); }
}

.recording-time {
  font-weight: 600;
  color: #FF3B30;
  font-size: 14px;
  min-width: 40px;
}

.recording-instruction-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* Voice Preview in Input */
.voice-input-preview {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #e3f2fd;
  border-radius: 20px;
  border: 1px solid #2196F3;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.voice-preview-display {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.voice-preview-display i {
  color: #2196F3;
  font-size: 16px;
}

.voice-preview-display span {
  flex: 1;
  font-size: 14px;
  color: #1976D2;
  font-weight: 500;
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

/* Voice Preview Progress Styling */
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
  border: 2px dashed #dc6bac;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-prompt:hover {
  border-color: #c85499;
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
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.send-photos-btn {
  padding: 0.75rem 2rem;
  background: #dc6bac;
  color: white;
  border: 2px solid #dc6bac;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.send-photos-btn:hover:not(:disabled) {
  background: #c85499;
  color: white;
  border-color: #c85499;
}

.send-photos-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* MESSAGE INPUT CONTAINER - MATCHING GROUPCHATVIEW */
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
.chat-view.embedded .message-input-container {
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
}

/* Mobile adjustments - no sidebars on mobile */
@media (max-width: 768px) {
  .message-input-container {
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
  }
  
  .chat-view.embedded .message-input-container {
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
  .chats-view.sidebar-collapsed .chat-view.embedded .message-input-container {
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}

.messages-container {
  background: #f8f9fa;
  margin-bottom: 0;
}

.chat-container {
  height: 100%;
  padding-bottom: 100px; /* Space for fixed message input */
  overflow: hidden;
}

/* Send Button - Matching GroupChatView */
.send-btn {
  background: #dc6bac;
  color: white;
  border: 2px solid #dc6bac;
}

.send-btn:hover:not(:disabled) {
  background: #c85499;
  color: white;
  border-color: #c85499;
}

/* Input Focus */
.message-input:focus {
  border-color: #dc6bac;
  box-shadow: 0 0 0 3px rgba(220, 107, 172, 0.1);
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

/* Mobile Responsive */
@media (max-width: 768px) {
  .chat-header {
    padding: 1rem;
  }
  
  .message-input-container {
    padding: 0.75rem 1rem;
    border-radius: 0 !important;
  }
  
  .messages-container {
    padding: 1rem 1rem 10px 1rem;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .scroll-to-bottom-btn {
    bottom: 120px;
    right: 1rem;
  }
}

/* New Voice Recording Styles */

/* Recording Input Area */
.recording-input-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 20px;
  border: 2px solid #FF3B30;
  min-height: 60px;
  width: 100%;
}

.recording-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.recording-mic-icon {
  color: #FF3B30;
  font-size: 18px;
  animation: pulse-mic 1s infinite;
}

@keyframes pulse-mic {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.recording-waveform {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  height: 24px;
}

.waveform-bar {
  width: 3px;
  background: #FF3B30;
  border-radius: 2px;
  transition: height 0.1s ease;
  opacity: 0.3;
}

.waveform-bar.active {
  opacity: 1;
  animation: waveform-bounce 0.6s ease-in-out infinite alternate;
}

@keyframes waveform-bounce {
  0% { transform: scaleY(0.5); }
  100% { transform: scaleY(1); }
}

.recording-time {
  font-weight: 600;
  color: #FF3B30;
  font-size: 14px;
  min-width: 40px;
}

.recording-instruction-text {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}



.mini-play-btn {
  background: #2196F3;
  color: white;
}

.mini-play-btn:hover {
  background: #1976D2;
}

.mini-play-btn.playing {
  background: #FF9800;
}

.mini-delete-btn {
  background: #ffebee;
  color: #f44336;
}

.mini-delete-btn:hover {
  background: #ffcdd2;
}

/* Crisis Alert Message Styles */
.message-crisis-alert {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 1rem;
  margin: 0.5rem 0;
}

.crisis-alert-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #dc2626;
  font-weight: 600;
  font-size: 1rem;
}

.crisis-alert-header i {
  font-size: 1.2rem;
  animation: pulse-warning 2s infinite;
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.crisis-alert-content {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #dc2626;
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.crisis-alert-details {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 0.75rem;
  display: grid;
  gap: 0.5rem;
}

.crisis-detail {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(220, 38, 38, 0.1);
}

.crisis-detail:last-child {
  border-bottom: none;
}

.crisis-detail strong {
  color: #dc2626;
  min-width: 120px;
  flex-shrink: 0;
}
</style> 