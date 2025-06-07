// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      communities: {
        Row: Community
        Insert: Omit<Community, 'id' | 'created_at' | 'updated_at' | 'member_count'>
        Update: Partial<Omit<Community, 'id' | 'created_at'>>
      }
      topics: {
        Row: Topic
        Insert: Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'message_count'>
        Update: Partial<Omit<Topic, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'attendee_count'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
    }
  }
}

// User Types
export interface User {
  id: string
  email: string
  name: string // Changed from full_name to match database
  avatar?: string // Changed from avatar_url to match database
  bio?: string
  role?: 'member' | 'moderator' | 'community_admin' | 'super_admin' // Updated role field
  status?: 'active' | 'inactive' | 'banned' // Added status field
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  created_at: string
  updated_at: string
}

// Community Types
export interface Community {
  id: string
  name: string
  description: string
  location: {
    latitude: number
    longitude: number
    address: string
    city: string
    country: string
  }
  member_count: number
  avatar_url?: string
  cover_image_url?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

// Topic Types
export interface Topic {
  id: string
  community_id: string
  name: string
  description?: string
  icon?: string
  message_count: number
  created_at: string
  updated_at: string
}

// Event Types
export interface Event {
  id: string
  community_id: string
  title: string
  description: string
  start_time: string
  end_time: string
  location: string
  price?: number
  max_attendees?: number
  attendee_count: number
  image_url?: string
  created_by: string
  created_at: string
  updated_at: string
}

// Message Types
export interface Message {
  id: string
  topic_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

// Community Member Types
export interface CommunityMember {
  id: string
  community_id: string
  user_id: string
  role: 'member' | 'moderator' | 'admin'
  joined_at: string
}

// Analytics Types
export interface DashboardStats {
  totalUsers: number
  totalCommunities: number
  totalTopics: number
  totalEvents: number
  totalMessages: number
  activeUsers: number
  newUsersToday: number
  newCommunitiesToday: number
}

export interface CommunityAnalytics {
  id: string
  name: string
  memberCount: number
  messageCount: number
  eventCount: number
  growthRate: number
  lastActivity: string
} 