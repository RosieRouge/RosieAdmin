// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at'>>
      }
      support_groups: {
        Row: SupportGroup
        Insert: Omit<SupportGroup, 'id' | 'created_at' | 'updated_at' | 'member_count'>
        Update: Partial<Omit<SupportGroup, 'id' | 'created_at'>>
      }
      support_cases: {
        Row: SupportCase
        Insert: Omit<SupportCase, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SupportCase, 'id' | 'created_at'>>
      }
      public_resources: {
        Row: PublicResource
        Insert: Omit<PublicResource, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'download_count'>
        Update: Partial<Omit<PublicResource, 'id' | 'created_at'>>
      }
    }
  }
}

// User Roles for Reproductive Health Support System
export type UserRole = 'client' | 'counselor' | 'admin' | 'super_admin'

// User Types
export interface User {
  id: string
  name?: string
  username?: string
  email: string
  role: UserRole // Single role field to match database schema
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Profile fields from database schema
  avatar?: string
  bio?: string
  phone?: string
  location?: any
  privacy_settings?: any
  panic_mode?: boolean
  emergency_contacts?: any
  social_links?: any
  last_active?: string
  is_verified?: boolean
  deleted_at?: string
  
  // Counselor specific fields (extended)
  license_number?: string
  specializations?: string[]
  active_cases?: number
  rating?: number
  avg_response_time?: string
  
  // Additional metadata
  last_login?: string
  preferences?: UserPreferences
  
  // User creation settings
  skip_email_verification?: boolean
  password_reset_required?: boolean
}

// User Preferences
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  notifications?: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy?: {
    show_profile: boolean
    allow_direct_messages: boolean
  }
}

// Support Case Types
export type CaseStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'escalated'

export type CaseType = 
  | 'abortion_support'
  | 'contraception_consultation'
  | 'pregnancy_counseling'
  | 'emotional_support'
  | 'legal_consultation'
  | 'crisis_intervention'
  | 'general_inquiry'

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'crisis'

export interface SupportCase {
  id: string
  title: string
  description?: string
  type: CaseType
  status: CaseStatus
  urgency: UrgencyLevel
  
  // Case assignment (matching database schema)
  client_id: string
  assigned_counselor_id?: string
  assigned_admin_id?: string
  
  // Case metadata (matching database schema)
  location?: any
  metadata?: any
  internal_notes?: any[]
  
  // Legacy fields for compatibility (TODO: remove after refactoring)
  is_crisis?: boolean
  is_anonymous?: boolean
  
  // Timestamps (matching database schema)
  created_at: string
  assigned_at?: string
  completed_at?: string
  closed_at?: string
  deleted_at?: string
  
  // Notes and communication
  notes?: CaseNote[]
  attachments?: CaseAttachment[]
  
  // Populated fields
  client?: User
  assigned_counselor?: User
}

export interface CaseNote {
  id: string
  case_id: string
  author_id: string
  content: string
  is_private: boolean
  created_at: string
  
  // Populated fields
  author?: User
}

export interface CaseAttachment {
  id: string
  case_id: string
  filename: string
  file_url: string
  file_size: number
  file_type: string
  uploaded_by: string
  uploaded_at: string
  
  // Populated fields
  uploaded_by_user?: User
}

// Support Group Types
export interface SupportGroup {
  id: string
  name: string
  description?: string
  category: SupportGroupCategory
  
  // Group settings
  is_private: boolean
  requires_approval: boolean
  max_members?: number
  
  // Meeting information
  meeting_type: MeetingType
  meeting_schedule?: string
  meeting_link?: string
  meeting_location?: string
  
  // Management
  created_by: string
  moderators: string[]
  
  // Status
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Statistics
  member_count?: number
  message_count?: number
  
  // Relationships
  created_by_user?: User
  moderator_users?: User[]
}

export type SupportGroupCategory = 
  | 'abortion_support'
  | 'pregnancy_loss'
  | 'contraception_support'
  | 'parenting_support'
  | 'lgbtq_reproductive_health'
  | 'teen_support'
  | 'general_support'

export type MeetingType = 'virtual' | 'in_person' | 'hybrid' | 'text_only'

// Public Resource Types
export type ResourceCategory = 
  | 'abortion_care'
  | 'contraception'
  | 'pregnancy_support'
  | 'legal_aid'
  | 'financial_assistance'
  | 'emotional_support'
  | 'healthcare_providers'
  | 'educational_materials'

export interface PublicResource {
  id: string
  title: string
  description?: string
  content: string
  category: ResourceCategory
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
  
  // Populated fields
  author?: User
  approved_by?: User
}

// Case Session Types
export type SessionType = 'counseling' | 'check_in' | 'crisis' | 'follow_up'
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export interface CaseSession {
  id: string
  case_id: string
  counselor_id: string
  client_id: string
  session_type: SessionType
  scheduled_at?: string
  started_at?: string
  ended_at?: string
  duration_minutes?: number
  session_notes?: string
  next_session_recommended: boolean
  client_feedback?: Record<string, any>
  status: SessionStatus
  created_at: string
  updated_at: string
  
  // Populated fields
  case?: SupportCase
  counselor?: User
  client?: User
}

// Topic Types (for support group discussions)
export interface Topic {
  id: string
  support_group_id: string
  created_by_id: string
  name: string
  description?: string
  icon?: string
  is_pinned: boolean
  is_locked: boolean
  requires_role?: string
  message_count: number
  last_message_at?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  
  // Populated fields
  support_group?: SupportGroup
  created_by?: User
}

// Message Types
export type MessageType = 
  | 'text'
  | 'image'
  | 'document'
  | 'voice'
  | 'system'
  | 'case_update'
  | 'assignment'

export interface Message {
  id: string
  topic_id: string
  sender_id: string
  parent_message_id?: string
  content: string
  message_type: MessageType
  attachments: Array<{
    url: string
    type: string
    filename: string
    size: number
  }>
  is_flagged: boolean
  is_hidden: boolean
  moderated_by_id?: string
  moderation_reason?: string
  reactions: Record<string, string[]>
  created_at: string
  updated_at: string
  deleted_at?: string
  
  // Populated fields
  topic?: Topic
  sender?: User
  parent_message?: Message
  moderated_by?: User
}

// Analytics Types
export interface DashboardStats {
  total_users: number
  total_cases: number
  pending_cases: number
  in_progress_cases: number
  resolved_cases: number
  crisis_cases: number
  active_counselors: number
  active_support_groups: number
  total_resources: number
  new_users_today: number
  new_cases_today: number
  avg_response_time: string
  case_distribution_by_type: Record<CaseType, number>
  case_distribution_by_urgency: Record<UrgencyLevel, number>
  counselor_workload: Array<{
    counselor_id: string
    counselor_name: string
    active_cases: number
    total_cases: number
  }>
}

export interface SupportGroupAnalytics {
  id: string
  name: string
  member_count: number
  message_count: number
  activity_score: number
  last_activity: string
  pending_applications: number
}

export interface CounselorAnalytics {
  id: string
  name: string
  active_cases: number
  total_cases: number
  resolved_cases: number
  avg_response_time: string
  client_satisfaction: number
  availability_hours: number
  last_active: string
}

// Form and Input Types for Admin Actions
export interface CreateCaseRequest {
  title: string
  description?: string
  type: CaseType
  urgency: UrgencyLevel
  client_id: string
  is_crisis?: boolean
  client_age_group?: 'minor' | 'adult' | 'not_specified'
  estimated_timeline?: string
}

export interface AssignCaseRequest {
  case_id: string
  counselor_id: string
  reason?: string
}

export interface CreateSupportGroupRequest {
  name: string
  description?: string
  is_public: boolean
  requires_approval: boolean
  max_members: number
  requires_screening: boolean
  facilitator_id?: string
  guidelines?: string
}

export interface CreateResourceRequest {
  title: string
  description?: string
  content: string
  category: ResourceCategory
  tags: string[]
  language: string
  downloadable: boolean
  external_url?: string
}

// Search and Filter Types
export interface UserSearchFilters {
  role?: UserRole
  is_active?: boolean
  search?: string
  date_range?: {
    start: string
    end: string
  }
}

export interface CaseSearchFilters {
  status?: CaseStatus[]
  type?: CaseType[]
  urgency?: UrgencyLevel[]
  assigned_counselor_id?: string
  is_crisis?: boolean
  date_range?: {
    start: string
    end: string
  }
}

export interface SupportGroupSearchFilters {
  is_public?: boolean
  requires_approval?: boolean
  search?: string
}

export interface ResourceSearchFilters {
  category?: ResourceCategory
  is_public?: boolean
  approved?: boolean
  search?: string
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  has_more: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// System Configuration Types
export interface SystemConfig {
  id: string
  key: string
  value: any
  description?: string
  updated_by: string
  updated_at: string
}

// Access Log Types (for audit trail)
export interface AccessLog {
  id: string
  admin_id: string
  action: string
  target_type: 'user' | 'case' | 'support_group' | 'resource' | 'system'
  target_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
  
  // Populated fields
  admin?: User
}

// Form types for admin operations
export interface CreateUserForm {
  name: string
  username?: string
  email: string
  password: string
  role: UserRole
  phone?: string
  specializations?: string[]
  bio?: string
  license_number?: string
  skip_email_verification?: boolean
}

export interface CreateCaseForm {
  client_id: string
  title: string
  description?: string
  type: CaseType
  urgency: UrgencyLevel
  is_crisis: boolean
  assigned_counselor_id?: string
}

export interface CreateResourceForm {
  title: string
  description: string
  content?: string
  category: ResourceCategory
  subcategory?: string
  resource_type: ResourceType
  url?: string
  language: string
  is_public: boolean
  required_verification: boolean
  location_type: LocationType
  state?: string
  city?: string
  tags?: string[]
}

export interface CreateSupportGroupForm {
  name: string
  description: string
  category: SupportGroupCategory
  is_private: boolean
  requires_approval: boolean
  max_members?: number
  meeting_type: MeetingType
  meeting_schedule?: string
  meeting_link?: string
  meeting_location?: string
  moderators: string[]
}

// Filter and search types
export interface CaseFilters {
  status?: CaseStatus
  type?: CaseType
  urgency?: UrgencyLevel
  counselor?: string
  is_crisis?: boolean
  date_from?: string
  date_to?: string
  search?: string
}

export interface UserFilters {
  role?: UserRole
  is_active?: boolean
  specialization?: string
  search?: string
}

export interface ResourceFilters {
  category?: ResourceCategory
  resource_type?: ResourceType
  location_type?: LocationType
  state?: string
  is_public?: boolean
  search?: string
}

export type ResourceType = 'article' | 'video' | 'pdf' | 'link' | 'directory' | 'phone_number'
export type LocationType = 'national' | 'state' | 'regional' | 'local' | 'online'

// Notification types
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  
  // Status
  is_read: boolean
  is_dismissed: boolean
  
  // Timestamps
  created_at: string
  read_at?: string
  dismissed_at?: string
  
  // Action data
  action_url?: string
  action_text?: string
  metadata?: Record<string, any>
}

export type NotificationType = 
  | 'case_assigned'
  | 'case_updated'
  | 'crisis_alert'
  | 'message_received'
  | 'system_alert'
  | 'resource_shared'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

// Audit log types
export interface AuditLog {
  id: string
  user_id: string
  action: AuditAction
  resource_type: string
  resource_id: string
  
  // Change details
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  
  // Context
  ip_address?: string
  user_agent?: string
  session_id?: string
  
  // Timestamps
  created_at: string
  
  // Relationships
  user?: User
}

export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'moderate'

// Error types
export interface AppError {
  code: string
  message: string
  details?: string
  timestamp: string
  user_id?: string
  request_id?: string
} 