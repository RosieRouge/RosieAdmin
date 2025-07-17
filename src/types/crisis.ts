import type { User } from './index'

// Crisis Alert Types
export interface CrisisAlert {
  id: string
  title?: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated'
  
  // Client information
  client_id?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  location?: string
  
  // Crisis details
  crisis_type?: 'immediate_danger' | 'medical_emergency' | 'emotional_distress' | 'legal_assistance' | 'financial_help' | 'travel_assistance' | 'other'
  is_immediate_danger: boolean
  needs_medical_attention: boolean
  needs_legal_help: boolean
  needs_financial_assistance: boolean
  needs_travel_help: boolean
  
  // Assignment information
  assigned_counselor_id?: string
  assigned_at?: string
  assigned_by?: string
  
  // Resolution information
  resolved_at?: string
  resolved_by?: string
  resolution_notes?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relationships
  client?: User
  assigned_counselor?: User
  responses?: CrisisAlertResponse[]
  
  // Additional data
  metadata?: Record<string, any>
}

export interface CrisisAlertResponse {
  id: string
  crisis_alert_id: string
  counselor_id: string
  response_type: 'initial_contact' | 'follow_up' | 'escalation' | 'resolution' | 'note'
  notes: string
  
  // Contact information
  contact_method?: 'phone' | 'email' | 'video_call' | 'in_person' | 'text' | 'other'
  contact_duration?: number // in minutes
  
  // Next steps
  next_action_required: boolean
  next_action_date?: string
  next_action_description?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Relationships
  counselor?: User
  crisis_alert?: CrisisAlert
  
  // Additional data
  metadata?: Record<string, any>
}

export interface CrisisAlertEscalation {
  id: string
  crisis_alert_id: string
  
  // Escalation details
  escalated_from?: string
  escalated_to?: string
  escalation_reason: string
  escalation_level: 'supervisor' | 'medical' | 'legal' | 'emergency_services'
  
  // Status tracking
  status: 'pending' | 'acknowledged' | 'resolved'
  acknowledged_at?: string
  resolved_at?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Additional data
  metadata?: Record<string, any>
}

export interface CrisisAlertFile {
  id: string
  crisis_alert_id: string
  
  // File information
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  mime_type?: string
  
  // Upload information
  uploaded_by?: string
  uploaded_at: string
  
  // Access control
  is_sensitive: boolean
  access_level: 'public' | 'counselors_only' | 'admin_only' | 'assigned_only'
}

// Crisis Alert Statistics
export interface CrisisAlertStats {
  total_alerts: number
  pending_alerts: number
  assigned_alerts: number
  in_progress_alerts: number
  resolved_alerts: number
  critical_alerts: number
  high_priority_alerts: number
  immediate_danger_alerts: number
  alerts_today: number
  alerts_this_week: number
  avg_assignment_time_minutes?: number
  avg_resolution_time_minutes?: number
}

// Counselor Crisis Workload
export interface CounselorCrisisWorkload {
  counselor_id: string
  counselor_name: string
  total_assigned: number
  active_cases: number
  resolved_cases: number
  critical_cases: number
  avg_resolution_time_minutes?: number
}

// Crisis Alert Filters
export interface CrisisAlertFilters {
  status?: ('pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated')[]
  priority?: ('critical' | 'high' | 'medium' | 'low')[]
  crisis_type?: ('immediate_danger' | 'medical_emergency' | 'emotional_distress' | 'legal_assistance' | 'financial_help' | 'travel_assistance' | 'other')[]
  assigned_counselor_id?: string
  is_immediate_danger?: boolean
  date_range?: {
    start: string
    end: string
  }
  search?: string
}

// Crisis Alert Forms
export interface CreateCrisisAlertForm {
  title?: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  
  // Client information
  client_id?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  location?: string
  
  // Crisis details
  crisis_type?: 'immediate_danger' | 'medical_emergency' | 'emotional_distress' | 'legal_assistance' | 'financial_help' | 'travel_assistance' | 'other'
  is_immediate_danger: boolean
  needs_medical_attention: boolean
  needs_legal_help: boolean
  needs_financial_assistance: boolean
  needs_travel_help: boolean
}

export interface UpdateCrisisAlertForm {
  title?: string
  description?: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  status?: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'escalated'
  assigned_counselor_id?: string
  resolution_notes?: string
}

export interface CreateCrisisResponseForm {
  crisis_alert_id: string
  response_type: 'initial_contact' | 'follow_up' | 'escalation' | 'resolution' | 'note'
  notes: string
  contact_method?: 'phone' | 'email' | 'video_call' | 'in_person' | 'text' | 'other'
  contact_duration?: number
  next_action_required: boolean
  next_action_date?: string
  next_action_description?: string
} 
 