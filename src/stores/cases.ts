import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export interface SupportCase {
  id: string
  title: string
  description: string
  type: 'abortion_support' | 'legal_aid' | 'financial_assistance' | 'transportation' | 'emotional_support' | 'other'
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
  urgency: 'low' | 'medium' | 'high' | 'critical'
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

export const useCasesStore = defineStore('cases', () => {
  const cases = ref<SupportCase[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const getUnassignedCases = computed(() => 
    cases.value.filter(c => !c.assigned_counselor_id && !c.assigned_admin_id)
  )

  const getCasesByStatus = computed(() => (status: string) => 
    cases.value.filter(c => c.status === status)
  )

  const getCasesByUrgency = computed(() => (urgency: string) => 
    cases.value.filter(c => c.urgency === urgency)
  )

  const getUserCases = computed(() => (userId: string) => 
    cases.value.filter(c => 
      c.client_id === userId || 
      c.assigned_counselor_id === userId || 
      c.assigned_admin_id === userId
    )
  )

  const getUrgentCases = computed(() => 
    cases.value.filter(c => c.urgency === 'critical' || c.urgency === 'high')
  )

  const dashboardStats = computed(() => ({
    totalCases: cases.value.length,
    activeCases: cases.value.filter(c => c.status === 'in_progress').length,
    completedCases: cases.value.filter(c => c.status === 'resolved').length,
    urgentCases: getUrgentCases.value.length
  }))

  // Actions
  const loadCases = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabaseAdmin
        .from('support_cases')
        .select(`
          id,
          client_id,
          assigned_counselor_id,
          assigned_admin_id,
          title,
          description,
          type,
          status,
          urgency,
          location,
          metadata,
          internal_notes,
          created_at,
          assigned_at,
          completed_at,
          closed_at,
          deleted_at,
          client:users!client_id(id, name, email),
          assigned_counselor:users!assigned_counselor_id(id, name, email),
          assigned_admin:users!assigned_admin_id(id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      cases.value = data || []
    } catch (err: any) {
      console.error('Error loading cases:', err)
      error.value = err.message
      cases.value = []
    } finally {
      loading.value = false
    }
  }

  const loadUserCases = async (userId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: fetchError } = await supabase
        .from('support_cases')
        .select(`
          *,
          client:users!client_id(id, name, email),
          assigned_counselor:users!assigned_counselor_id(id, name, email),
          assigned_admin:users!assigned_admin_id(id, name, email)
        `)
        .or(`client_id.eq.${userId},assigned_counselor_id.eq.${userId},assigned_admin_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      cases.value = data || []
    } catch (err: any) {
      console.error('Error loading user cases:', err)
      error.value = err.message
      cases.value = []
    } finally {
      loading.value = false
    }
  }

  const createCase = async (caseData: Partial<SupportCase>) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: createError } = await supabase
        .from('support_cases')
        .insert(caseData)
        .select()
        .single()

      if (createError) {
        throw createError
      }

      cases.value.unshift(data)
      return data
    } catch (err: any) {
      console.error('Error creating case:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCase = async (caseId: string, updates: any) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('Updating case with:', { caseId, updates })
      
      // Clean the updates object to only include valid database fields
      const cleanUpdates: any = {}
      
      if (updates.status) cleanUpdates.status = updates.status
      if (updates.assigned_counselor_id !== undefined) cleanUpdates.assigned_counselor_id = updates.assigned_counselor_id
      if (updates.assigned_admin_id !== undefined) cleanUpdates.assigned_admin_id = updates.assigned_admin_id
      if (updates.assigned_at) cleanUpdates.assigned_at = updates.assigned_at
      if (updates.completed_at) cleanUpdates.completed_at = updates.completed_at
      if (updates.closed_at) cleanUpdates.closed_at = updates.closed_at
      
      console.log('Clean updates:', cleanUpdates)
      
      const { data, error: updateError } = await supabaseAdmin
        .from('support_cases')
        .update(cleanUpdates)
        .eq('id', caseId)
        .select()
        .single()

      console.log('Update result:', { data, error: updateError })

      if (updateError) {
        console.error('Update error details:', updateError)
        throw updateError
      }

      const index = cases.value.findIndex(c => c.id === caseId)
      if (index !== -1) {
        cases.value[index] = data
      }

      return data
    } catch (err: any) {
      console.error('Error updating case:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const assignCase = async (caseId: string, assigneeId: string, assigneeType: 'counselor' | 'admin') => {
    const updates: any = {
      status: 'assigned',
      assigned_at: new Date().toISOString()
    }

    if (assigneeType === 'counselor') {
      updates.assigned_counselor_id = assigneeId
    } else {
      updates.assigned_admin_id = assigneeId
    }

    return updateCase(caseId, updates)
  }

  const deleteCase = async (caseId: string) => {
    loading.value = true
    error.value = null
    
    try {
      const { error: deleteError } = await supabase
        .from('support_cases')
        .delete()
        .eq('id', caseId)

      if (deleteError) {
        throw deleteError
      }

      cases.value = cases.value.filter(c => c.id !== caseId)
    } catch (err: any) {
      console.error('Error deleting case:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadDashboardStats = async () => {
    // Dashboard stats are computed from existing cases
    console.log('Dashboard stats loaded from computed values')
  }

  const loadAvailableDoulas = async () => {
    // Simplified - just log for now
    console.log('Loading available counselors/doulas')
  }

  return {
    // State
    cases,
    loading,
    error,
    
    // Getters
    getUnassignedCases,
    getCasesByStatus,
    getCasesByUrgency,
    getUserCases,
    getUrgentCases,
    dashboardStats,
    
    // Actions
    loadCases,
    loadUserCases,
    createCase,
    updateCase,
    assignCase,
    deleteCase,
    loadDashboardStats,
    loadAvailableDoulas
  }
}) 