// User Types
export type UserRole = 'client' | 'counselor' | 'admin' | 'super_admin'

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  bio?: string
  phone?: string
  role: UserRole  // Primary role for backward compatibility
  roles?: UserRole[]  // Multiple roles support
  specializations?: string[]  // For counselors
  license_number?: string  // For counselors
  location?: any
  privacy_settings?: any
  created_at: string
  updated_at: string
  last_active: string
  is_verified: boolean
  is_active: boolean
  rating?: number  // For counselors
  active_cases?: number  // For counselors
  // Add additional counselor-specific fields
  password_reset_required?: boolean
  username?: string
}

// Case Types
export type CaseStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
export type CaseType = 'abortion_support' | 'legal_aid' | 'financial_assistance' | 'transportation' | 'emotional_support' | 'other'
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'

export interface SupportCase {
  id: string
  title: string
  description: string
  type: CaseType
  status: CaseStatus
  urgency: UrgencyLevel
  client_id: string
  assigned_counselor_id?: string
  assigned_admin_id?: string
  created_at: string
  assigned_at?: string
  completed_at?: string
  closed_at?: string
  metadata?: any
  location?: any
  internal_notes?: any[]
}

// Direct Message Types
export interface DirectConversation {
  id: string
  user1_id: string
  user2_id: string
  last_message_at: string
  last_message?: DirectMessage
  other_user?: User
  unread_count?: number
  created_at: string
  updated_at: string
}

export interface DirectMessage {
  id: string
  sender_id: string
  recipient_id: string
  conversation_id: string
  content: string
  message_type?: 'text' | 'voice' | 'photo' | 'gif'
  media_url?: string
  media_data?: any
  attachments?: any[]
  is_read: boolean
  read_at?: string
  created_at: string
  deleted_at?: string
}

// Support Group Types
export type SupportGroupCategory = 'pre_abortion' | 'post_abortion' | 'crisis_support' | 'ongoing_support' | 'legal_support' | 'financial_support' | 'emotional_support' | 'teen_support' | 'partner_support' | 'family_support'
export type SupportGroupType = 'peer_support' | 'professional_support' | 'mixed_support'
export type SupportGroupStatus = 'active' | 'inactive' | 'archived'
export type MeetingType = 'online' | 'in_person' | 'hybrid'

export interface SupportGroup {
  id: string
  name: string
  description?: string
  category: SupportGroupCategory
  type: SupportGroupType
  status: SupportGroupStatus
  is_private: boolean
  is_confidential: boolean
  requires_approval: boolean
  max_members: number
  meeting_type: MeetingType
  meeting_schedule?: string
  meeting_link?: string
  meeting_location?: string
  time_zone?: string
  country?: string
  region?: string
  city?: string
  language: string
  created_by: string
  facilitator_id?: string
  questionnaire?: any[]
  visible_to_users: boolean
  visible_to_counselors: boolean
  visible_to_admins: boolean
  visible_to_super_admins: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  member_count?: number
  is_member?: boolean
  member_role?: string
  joined_at?: string
}

// Message Types
export interface Message {
  id: string
  topic_id?: string
  support_group_id?: string
  sender_id: string
  content: string
  message_type?: 'text' | 'voice' | 'photo' | 'gif'
  media_url?: string
  media_data?: any
  attachments?: any[]
  reactions?: any
  is_flagged: boolean
  is_hidden: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  user?: User
  user_name?: string
  user_avatar?: string
}

// Topic Types
export interface Topic {
  id: string
  support_group_id?: string
  community_id?: string
  created_by: string
  name: string
  description?: string
  icon?: string
  is_pinned: boolean
  is_locked: boolean
  is_hidden: boolean
  requires_role?: string
  message_count: number
  last_message_at?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

// Crisis Alert Types
export interface CrisisAlert {
  id: string
  title?: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated'
  client_id?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  location?: string
  crisis_type?: 'immediate_danger' | 'medical_emergency' | 'emotional_distress' | 'legal_assistance' | 'financial_help' | 'travel_assistance' | 'other'
  is_immediate_danger: boolean
  needs_medical_attention: boolean
  needs_legal_help: boolean
  needs_financial_assistance: boolean
  needs_travel_help: boolean
  assigned_counselor_id?: string
  assigned_at?: string
  assigned_by?: string
  resolved_at?: string
  resolved_by?: string
  resolution_notes?: string
  created_at: string
  updated_at: string
  metadata?: any
}

// Resource Types
export type ResourceCategory = 'healthcare' | 'legal' | 'financial' | 'educational' | 'emotional_support' | 'transportation' | 'housing' | 'other'

export interface PublicResource {
  id: string
  title: string
  description?: string
  content: string
  category: string
  tags: string[]
  language: string
  is_public: boolean
  downloadable: boolean
  external_url?: string
  file_url?: string
  author_id?: string
  approved_by_id?: string
  approved_at?: string
  view_count: number
  download_count: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

// Types are already exported above 