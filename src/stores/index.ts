import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Basic User Store (simplified for admin use)
export const useUserStore = defineStore('user', () => {
  const currentUser = ref<any>(null)
  const loading = ref(false)

  const loadCurrentUser = async (userId: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      currentUser.value = data
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      loading.value = false
    }
  }

  const joinCommunity = async (communityId: string, isDefault = false) => {
    // Simplified admin version - just log for now
    console.log('Admin joinCommunity called:', { communityId, isDefault })
  }

  return {
    currentUser,
    loading,
    loadCurrentUser,
    joinCommunity
  }
})

// Basic Communities Store (simplified for admin use)
export const useCommunitiesStore = defineStore('communities', () => {
  const communities = ref<any[]>([])
  const currentCommunity = ref<any>(null)
  const loading = ref(false)

  const getCommunityById = (id: string) => {
    return communities.value.find(c => c.id === id) || null
  }

  const loadCommunities = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('support_groups')
        .select('*')
        .eq('type', 'community')

      if (error) throw error
      communities.value = data || []
    } catch (error) {
      console.error('Error loading communities:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    communities,
    currentCommunity,
    loading,
    getCommunityById,
    loadCommunities
  }
})

// Basic Direct Messages Store (for chat functionality)
export const useDirectMessagesStore = defineStore('directMessages', {
  state: () => ({
    conversations: [] as any[],
    currentConversation: null as any | null,
    messages: [] as any[],
    unreadCount: 0,
    loading: false
  }),

  getters: {
    getConversationById: (state) => (id: string) => {
      const found = state.conversations.find(conv => conv.id === id)
      console.log('🔍 getConversationById called:', {
        searchId: id,
        totalConversations: state.conversations.length,
        foundConversation: !!found,
        availableIds: state.conversations.map(c => c.id)
      })
      return found
    },
    
    getOtherUser: (state) => (conversation: any, currentUserId: string) => {
      if (!conversation) {
        console.log('🔍 getOtherUser - no conversation provided')
        return null
      }
      
      if (!currentUserId) {
        console.log('🔍 getOtherUser - no current user ID')
        return null
      }
      
      // The other_user should already be processed in loadConversations
      const result = conversation.other_user
      
      console.log('🔍 getOtherUser result:', {
        conversationId: conversation.id,
        currentUserId,
        user1_id: conversation.user1_id,
        user2_id: conversation.user2_id,
        other_user: conversation.other_user,
        result
      })
      
      return result || { id: 'unknown', name: 'Unknown User' }
    }
  },

  actions: {
    async loadConversations(userId: string) {
      this.loading = true
      try {
        // Get conversations with last message and other user info
        const { data: conversations, error } = await supabase
          .from('direct_conversations')
          .select(`
            id,
            user1_id,
            user2_id,
            created_at,
            updated_at,
            last_message_at,
            is_crisis_chat,
            crisis_alert_id
          `)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .order('last_message_at', { ascending: false })

        if (error) throw error

        if (conversations && conversations.length > 0) {
          // Get other user IDs and convert to string to handle mixed data types
          const otherUserIds = conversations.map(conv => {
            const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
            return String(otherUserId) // Convert to string since user2_id is text in schema
          })

          console.log('🔍 Fetching other users:', {
            conversations: conversations.map(c => ({ id: c.id, user1_id: c.user1_id, user2_id: c.user2_id })),
            currentUserId: userId,
            otherUserIds
          })

          // Get other users' details using admin client for better access
          const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, name, email, avatar')
            .in('id', otherUserIds)

          console.log('🔍 Users fetch result:', {
            requestedIds: otherUserIds,
            foundUsers: users?.length || 0,
            users: users?.map(u => ({ id: u.id, name: u.name })) || [],
            error: usersError
          })

          if (usersError) throw usersError

          // Get last messages for each conversation
          const conversationIds = conversations.map(conv => conv.id)
          const { data: lastMessages, error: messagesError } = await supabase
            .from('direct_messages')
            .select('*')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false })

          if (messagesError) throw messagesError

          // Process conversations with user info and last messages
          this.conversations = conversations.map(conv => {
            // Handle mixed data types - user1_id is UUID, user2_id might be text
            const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
            
            // Convert to string for comparison since user2_id is text in schema
            const otherUserIdString = String(otherUserId)
            const otherUser = users?.find(u => u.id === otherUserIdString)
            const lastMessage = lastMessages?.find(m => m.conversation_id === conv.id)
            
            // Count unread messages for this conversation
            const unreadMessages = lastMessages?.filter(m => 
              m.conversation_id === conv.id && 
              m.sender_id !== userId && 
              !m.is_read
            ) || []

            const processedConv = {
              ...conv,
              created_at: new Date(conv.created_at),
              updated_at: new Date(conv.updated_at),
              last_message_at: new Date(conv.last_message_at),
              other_user: otherUser ? {
                id: otherUser.id,
                name: otherUser.name,
                email: otherUser.email,
                avatar: otherUser.avatar
              } : undefined,
              last_message: lastMessage ? {
                ...lastMessage,
                created_at: new Date(lastMessage.created_at),
                updated_at: new Date(lastMessage.updated_at)
              } : undefined,
              unread_count: unreadMessages.length
            }
            
            console.log('🔍 Processing conversation:', {
              id: conv.id,
              user1_id: conv.user1_id,
              user2_id: conv.user2_id,
              currentUserId: userId,
              otherUserId,
              otherUserIdString,
              otherUserFound: !!otherUser,
              otherUserName: otherUser?.name,
              processedOtherUser: processedConv.other_user,
              usersAvailable: users?.length || 0
            })
            
            return processedConv
          })

        } else {
          this.conversations = []
        }

        // Update total unread count
        await this.updateUnreadCount(userId)

      } catch (error) {
        console.error('Error loading conversations:', error)
        this.conversations = []
      } finally {
        this.loading = false
      }
    },

    async loadMessages(conversationId: string, userId: string) {
      try {
        const { data: messages, error } = await supabase
          .from('direct_messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            message_type,
            media_url,
            media_data,
            is_read,
            created_at
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (error) throw error

        this.messages = messages?.map(msg => ({
          ...msg,
          created_at: new Date(msg.created_at)
        })) || []

        // Mark messages as read
        await this.markMessagesAsRead(conversationId, userId)

      } catch (error) {
        console.error('Error loading messages:', error)
        this.messages = []
      }
    },

    async sendMessage(conversationId: string, senderId: string, content: string, messageType: 'text' | 'gif' | 'voice' | 'photo' | 'video' | 'document' | 'location' | 'contact' | 'poll' | 'event' | 'crisis_alert' = 'text', mediaUrl?: string, mediaData?: string) {
      try {
        console.log('🔍 Store sendMessage called with:', {
          conversationId,
          senderId,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          messageType,
          hasMediaUrl: !!mediaUrl,
          hasMediaData: !!mediaData
        })
        
        const insertData = {
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          media_url: mediaUrl,
          media_data: mediaData
        }
        
        console.log('🔍 Insert data:', insertData)
        
        const { data: message, error } = await supabase
          .from('direct_messages')
          .insert(insertData)
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            message_type,
            media_url,
            media_data,
            is_read,
            created_at
          `)
          .single()

        console.log('🔍 Supabase insert result:', { message, error })

        if (error) {
          console.error('❌ Supabase insert error:', error)
          throw error
        }

        const newMessage = {
          ...message,
          created_at: new Date(message.created_at)
        }

        console.log('🔍 Processed new message:', newMessage)

        this.messages.push(newMessage)
        
        console.log('🔍 Messages array length after push:', this.messages.length)
        
        // Update the conversation's last message and timestamp
        const { error: updateError } = await supabase
          .from('direct_conversations')
          .update({ 
            last_message_at: new Date().toISOString() 
          })
          .eq('id', conversationId)
        
        if (updateError) {
          console.error('❌ Error updating conversation timestamp:', updateError)
        } else {
          console.log('✅ Updated conversation timestamp')
        }
        
        // Update local conversation
        const conversationIndex = this.conversations.findIndex(conv => conv.id === conversationId)
        if (conversationIndex !== -1) {
          this.conversations[conversationIndex].last_message = newMessage
          this.conversations[conversationIndex].last_message_at = newMessage.created_at
          console.log('✅ Updated local conversation at index:', conversationIndex)
        } else {
          console.log('❌ Could not find conversation in local store:', {
            searchId: conversationId,
            availableIds: this.conversations.map(c => c.id)
          })
        }

        console.log('✅ Store sendMessage completed successfully')
        return newMessage

      } catch (error) {
        console.error('❌ Store sendMessage error:', error)
        throw error
      }
    },

    async deleteMessage(messageId: string, userId: string) {
      try {
        console.log('🗑️ Deleting message:', { messageId, userId })
        
        // Soft delete by setting deleted_at timestamp
        const { error } = await supabase
          .from('direct_messages')
          .update({ 
            deleted_at: new Date().toISOString(),
            content: '[Message deleted]'
          })
          .eq('id', messageId)
          .eq('sender_id', userId) // Only allow deletion by sender

        if (error) {
          console.error('❌ Error deleting message:', error)
          throw error
        }

        // Update local state
        const messageIndex = this.messages.findIndex(msg => msg.id === messageId)
        if (messageIndex !== -1) {
          this.messages[messageIndex] = {
            ...this.messages[messageIndex],
            content: '[Message deleted]',
            deleted_at: new Date().toISOString()
          }
        }

        console.log('✅ Message deleted successfully')
        return true

      } catch (error) {
        console.error('❌ Error deleting message:', error)
        throw error
      }
    },

    async createOrGetConversation(currentUserId: string, otherUserId: string) {
      try {
        
        // Check if conversation already exists
        const conversationId = `dm_${[currentUserId, otherUserId].sort().join('_')}`
        
        let { data: existingConversations, error: checkError } = await supabase
          .from('direct_conversations')
          .select('*')
          .eq('id', conversationId)

        if (checkError) {
          throw checkError
        }
        
        let existingConversation = existingConversations?.[0] || null

        if (!existingConversation) {
          // Create new conversation
          const { data: newConversation, error: createError } = await supabase
            .from('direct_conversations')
            .insert({
              id: conversationId,
              user1_id: currentUserId,
              user2_id: otherUserId,
              last_message_at: new Date().toISOString()
            })
            .select()
            .single()

          if (createError) throw createError
          existingConversation = newConversation
        }

        // Reload conversations to get the updated list
        await this.loadConversations(currentUserId)
        
        return conversationId

      } catch (error) {
        console.error('Error creating/getting conversation:', error)
        throw error
      }
    },

    async markMessagesAsRead(conversationId: string, userId: string) {
      try {
        const { error } = await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', userId)
          .eq('is_read', false)

        if (error) throw error

        // Update local state
        this.messages.forEach(msg => {
          if (msg.conversation_id === conversationId && msg.sender_id !== userId) {
            msg.is_read = true
          }
        })

        // Update conversation unread count
        const conversation = this.conversations.find(conv => conv.id === conversationId)
        if (conversation) {
          conversation.unread_count = 0
        }

        // Update total unread count
        await this.updateUnreadCount(userId)

      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    },

    async updateUnreadCount(userId: string) {
      try {
        // Calculate unread count from conversations
        const unreadCount = this.conversations.reduce((total, conv) => {
          return total + (conv.unread_count || 0)
        }, 0)

        this.unreadCount = unreadCount

      } catch (error) {
        this.unreadCount = 0
      }
    },

    setCurrentConversation(conversation: any | null) {
      this.currentConversation = conversation
    },

    clearMessages() {
      this.messages = []
    }
  }
}) 