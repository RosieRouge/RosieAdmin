import { defineStore } from 'pinia'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { DirectConversation, DirectMessage, User } from '@/types'

export const useDirectMessagesStore = defineStore('directMessages', {
  state: () => ({
    conversations: [] as DirectConversation[],
    currentConversation: null as DirectConversation | null,
    messages: [] as DirectMessage[],
    unreadCount: 0,
    loading: false
  }),

  getters: {
    getConversationById: (state) => (id: string) => {
      return state.conversations.find(conv => conv.id === id)
    }
  },

  actions: {
    async loadConversations(userId: string) {
      this.loading = true
      try {
        console.log('Loading conversations for admin user:', userId)
        
        // Get conversations with last message and other user info
        const { data: conversations, error } = await supabaseAdmin
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

        console.log('Raw conversations:', conversations)

        if (conversations && conversations.length > 0) {
          // Get other user IDs
          const otherUserIds = conversations.map(conv => 
            conv.user1_id === userId ? conv.user2_id : conv.user1_id
          )

          // Get other users' details
          const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, name, email, avatar, role')
            .in('id', otherUserIds)

          if (usersError) throw usersError

          // Get last messages for each conversation
          const conversationIds = conversations.map(conv => conv.id)
          const { data: lastMessages, error: messagesError } = await supabaseAdmin
            .from('direct_messages')
            .select('*')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false })

          if (messagesError) throw messagesError

          // Process conversations with user info and last messages
          this.conversations = conversations.map(conv => {
            const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
            const otherUser = users?.find(u => u.id === otherUserId)
            const lastMessage = lastMessages?.find(m => m.conversation_id === conv.id)
            
            // Count unread messages for this conversation
            const unreadMessages = lastMessages?.filter(m => 
              m.conversation_id === conv.id && 
              m.sender_id !== userId && 
              !m.is_read
            ) || []

            return {
              id: conv.id,
              user1_id: conv.user1_id,
              user2_id: conv.user2_id,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              last_message_at: conv.last_message_at,
              other_user: otherUser ? {
                id: otherUser.id,
                email: otherUser.email,
                name: otherUser.name,
                avatar: otherUser.avatar,
                role: otherUser.role,
                created_at: '',
                updated_at: '',
                last_active: '',
                is_verified: false,
                is_active: true
              } as User : undefined,
              last_message: lastMessage ? {
                id: lastMessage.id,
                sender_id: lastMessage.sender_id,
                recipient_id: lastMessage.recipient_id,
                conversation_id: lastMessage.conversation_id,
                content: lastMessage.content,
                message_type: lastMessage.message_type,
                media_url: lastMessage.media_url,
                media_data: lastMessage.media_data,
                attachments: lastMessage.attachments,
                is_read: lastMessage.is_read,
                read_at: lastMessage.read_at,
                created_at: lastMessage.created_at,
                deleted_at: lastMessage.deleted_at
              } as DirectMessage : undefined,
              unread_count: unreadMessages.length
            } as DirectConversation
          })

          console.log('Processed conversations:', this.conversations)
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
        console.log('Loading messages for conversation:', conversationId)
        
        const { data: messages, error } = await supabaseAdmin
          .from('direct_messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            recipient_id,
            case_id,
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

        this.messages = messages || []

        console.log('Loaded messages:', this.messages)

        // Mark messages as read
        await this.markMessagesAsRead(conversationId, userId)

      } catch (error) {
        console.error('Error loading messages:', error)
        this.messages = []
      }
    },

    async sendMessage(conversationId: string, senderId: string, recipientId: string, content: string, caseId?: string, messageType: 'text' | 'voice' | 'photo' | 'gif' = 'text', mediaUrl?: string, mediaData?: any) {
      try {
        console.log('Sending message:', { conversationId, senderId, recipientId, content, caseId })
        
        const { data: message, error } = await supabaseAdmin
          .from('direct_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            recipient_id: recipientId,
            case_id: caseId,
            content,
            message_type: messageType,
            media_url: mediaUrl,
            media_data: mediaData
          })
          .select(`
            id,
            conversation_id,
            sender_id,
            recipient_id,
            case_id,
            content,
            message_type,
            media_url,
            media_data,
            is_read,
            created_at
          `)
          .single()

        if (error) throw error

        const newMessage: DirectMessage = {
          ...message,
          created_at: message.created_at
        }

        this.messages.push(newMessage)
        
        // Update the conversation's last message
        const conversationIndex = this.conversations.findIndex(conv => conv.id === conversationId)
        if (conversationIndex !== -1) {
          this.conversations[conversationIndex].last_message = newMessage
          this.conversations[conversationIndex].last_message_at = newMessage.created_at
        }

        console.log('Message sent successfully:', newMessage)
        return newMessage

      } catch (error) {
        console.error('Error sending message:', error)
        throw error
      }
    },

    async createOrGetConversation(currentUserId: string, otherUserId: string, caseId?: string) {
      try {
        console.log('Creating/getting conversation between:', currentUserId, 'and', otherUserId, 'for case:', caseId)
        
        // Use the same format as admin panel: dm_[sorted user IDs]
        const conversationId = `dm_${[currentUserId, otherUserId].sort().join('_')}`
        
        // Check if conversation already exists
        let { data: existingConversations, error: checkError } = await supabaseAdmin
          .from('direct_conversations')
          .select('*')
          .eq('id', conversationId)

        if (checkError) {
          throw checkError
        }
        
        let existingConversation = existingConversations?.[0] || null

        if (!existingConversation) {
          // Create new conversation
          const { data: newConversation, error: createError } = await supabaseAdmin
            .from('direct_conversations')
            .insert({
              id: conversationId,
              user1_id: currentUserId,
              user2_id: otherUserId,
              is_crisis_chat: !!caseId,
              crisis_alert_id: caseId,
              last_message_at: new Date().toISOString()
            })
            .select()
            .single()

          if (createError) throw createError
          existingConversation = newConversation
        }

        console.log('Got conversation ID:', conversationId)
        
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
        const { error } = await supabaseAdmin
          .from('direct_messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
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
        const { data: unreadMessages, error } = await supabaseAdmin
          .from('direct_messages')
          .select('id')
          .eq('recipient_id', userId)
          .eq('is_read', false)

        if (error) throw error

        this.unreadCount = unreadMessages?.length || 0
        console.log('Updated unread count:', this.unreadCount)

      } catch (error) {
        console.log('Error updating unread count, defaulting to 0:', error)
        this.unreadCount = 0
      }
    },

    setCurrentConversation(conversation: DirectConversation | null) {
      this.currentConversation = conversation
    },

    clearMessages() {
      this.messages = []
    }
  }
}) 