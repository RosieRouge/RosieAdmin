import { supabase, supabaseAdmin } from '@/lib/supabase'

export interface SupportGroup {
  id: string
  name: string
  description: string
  category: SupportGroupCategory
  type: SupportGroupType
  
  // Group settings
  is_private: boolean
  is_confidential: boolean
  requires_approval: boolean
  max_members: number
  questionnaire?: QuestionnaireQuestion[]
  
  // Role-based visibility
  visible_to_users: boolean
  visible_to_counselors: boolean
  visible_to_admins: boolean
  visible_to_super_admins: boolean
  group_type?: 'support' | 'chat'
  
  // Meeting information
  meeting_type: MeetingType
  meeting_schedule?: string
  meeting_link?: string
  meeting_location?: string
  time_zone?: string
  
  // Location information
  country?: string
  region?: string
  city?: string
  language: string
  
  // Management
  created_by: string
  moderators: string[]
  
  // Status
  status: GroupStatus
  created_at: string
  updated_at: string
  last_activity?: string
  
  // Statistics
  member_count: number
  message_count: number
  
  // Relationships
  created_by_user?: {
    id: string
    name: string
    email: string
  }
  moderator_users?: Array<{
    id: string
    name: string
    email: string
  }>
}

export interface SupportGroupMember {
  id: string
  user_id: string
  support_group_id: string
  role: MemberRole
  joined_at: string
  left_at?: string
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export interface QuestionnaireAnswer {
  question: string
  answer: string | string[]
  question_type: 'text' | 'textarea' | 'multiple_choice' | 'yes_no'
}

export interface JoinRequest {
  id: string
  user_id: string
  support_group_id: string
  request_message?: string
  questionnaire_answers?: QuestionnaireAnswer[]
  status: RequestStatus
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  group?: {
    id: string
    name: string
    category: SupportGroupCategory
    questionnaire?: QuestionnaireQuestion[]
  }
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface GroupStatistics {
  total_groups: number
  active_groups: number
  pending_groups: number
  total_members: number
  avg_members_per_group: number
  new_groups_this_week: number
  groups_approved_today: number
  groups_by_category: Record<SupportGroupCategory, number>
  groups_by_country: Record<string, number>
  groups_by_language: Record<string, number>
  recent_activity: Array<{
    group_id: string
    group_name: string
    activity_type: string
    count: number
    date: string
  }>
}

export type SupportGroupCategory = 
  | 'pre_abortion'
  | 'post_abortion'
  | 'crisis_support'
  | 'ongoing_support'
  | 'legal_support'
  | 'financial_support'
  | 'emotional_support'
  | 'teen_support'
  | 'partner_support'
  | 'family_support'

export type SupportGroupType = 
  | 'peer_support'
  | 'professional_led'
  | 'hybrid'
  | 'crisis_intervention'
  | 'educational'
  | 'advocacy'

export type MeetingType = 
  | 'virtual'
  | 'in_person'
  | 'hybrid'
  | 'text_only'
  | 'phone'
  | 'video_call'

export type GroupStatus = 
  | 'pending'
  | 'active'
  | 'paused'
  | 'archived'
  | 'suspended'

export type MemberRole = 
  | 'member'
  | 'moderator'
  | 'admin'
  | 'facilitator'

export type RequestStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'

export interface QuestionnaireQuestion {
  question: string
  type: 'text' | 'textarea' | 'multiple_choice' | 'yes_no'
  options?: string[]
  required: boolean
}

export type MuteDuration = '1hour' | '1day' | '1week' | '1month' | '3months' | '6months' | '1year'

export interface ModerationAction {
  id: string
  group_id: string
  user_id: string
  action_type: 'ban' | 'mute' | 'unban' | 'unmute'
  duration?: MuteDuration
  reason?: string
  moderator_id: string
  created_at: string
  expires_at?: string
}

export interface CreateSupportGroupData {
  name: string
  description: string
  category: SupportGroupCategory
  type: SupportGroupType
  is_private: boolean
  is_confidential: boolean
  requires_approval: boolean
  max_members: number
  visible_to_users: boolean
  visible_to_counselors: boolean
  visible_to_admins: boolean
  visible_to_super_admins: boolean
  group_type?: 'support' | 'chat'
  meeting_type: MeetingType
  meeting_schedule?: string
  meeting_link?: string
  meeting_location?: string
  time_zone?: string
  country?: string
  region?: string
  city?: string
  language: string
  moderators?: string[]
  questionnaire?: QuestionnaireQuestion[]
}

export interface UpdateSupportGroupData extends Partial<CreateSupportGroupData> {
  status?: GroupStatus
  last_activity?: string
}

export interface SupportGroupFilters {
  category?: SupportGroupCategory
  type?: SupportGroupType
  status?: GroupStatus
  country?: string
  language?: string
  meeting_type?: MeetingType
  search?: string
  created_by?: string
}

class SupportGroupsService {
  // Support Group CRUD Operations
  async getAllSupportGroups(filters?: SupportGroupFilters): Promise<SupportGroup[]> {
    try {
      console.log('Fetching support groups with filters:', filters)
      let query = supabaseAdmin
        .from('support_groups')
        .select(`
          *,
          member_count:support_group_members(count)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.country) {
        query = query.eq('country', filters.country)
      }
      if (filters?.language) {
        query = query.eq('language', filters.language)
      }
      if (filters?.meeting_type) {
        query = query.eq('meeting_type', filters.meeting_type)
      }
      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching support groups:', error)
        console.log('Returning empty array due to error')
        return []
      }

      // Transform the data to flatten member_count
      const groupsWithMemberCount = (data || []).map(group => ({
        ...group,
        member_count: Array.isArray(group.member_count) ? group.member_count[0]?.count || 0 : 0
      }))

      console.log('Support groups fetched successfully:', groupsWithMemberCount.length)
      return groupsWithMemberCount
    } catch (error) {
      console.error('Error in getAllSupportGroups:', error)
      console.log('Returning empty array due to exception')
      return []
    }
  }

  async getSupportGroupById(id: string): Promise<SupportGroup | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('support_groups')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching support group:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getSupportGroupById:', error)
      throw error
    }
  }

  async createSupportGroup(groupData: CreateSupportGroupData, createdBy: string): Promise<SupportGroup> {
    try {
      console.log('Creating support group with data:', groupData)
      console.log('Created by:', createdBy)
      
      // Map the data to match existing schema
      const insertData = {
        name: groupData.name,
        description: groupData.description,
        category: groupData.category,
        type: groupData.type,
        is_private: groupData.is_private,
        is_confidential: groupData.is_confidential,
        requires_approval: groupData.requires_approval,
        max_members: groupData.max_members,
        meeting_type: groupData.meeting_type,
        meeting_schedule: groupData.meeting_schedule,
        meeting_link: groupData.meeting_link,
        meeting_location: groupData.meeting_location,
        time_zone: groupData.time_zone,
        country: groupData.country,
        region: groupData.region,
        city: groupData.city,
        language: groupData.language,
        created_by: createdBy,
        facilitator_id: createdBy, // Set creator as facilitator
        questionnaire: groupData.questionnaire || null,
        status: 'active' as GroupStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Role-based visibility controls (only add if provided)
        ...(groupData.visible_to_users !== undefined && { visible_to_users: groupData.visible_to_users }),
        ...(groupData.visible_to_counselors !== undefined && { visible_to_counselors: groupData.visible_to_counselors }),
        ...(groupData.visible_to_admins !== undefined && { visible_to_admins: groupData.visible_to_admins }),
        ...(groupData.visible_to_super_admins !== undefined && { visible_to_super_admins: groupData.visible_to_super_admins })
      }
      
      console.log('=== ADMIN: Creating Support Group ===')
      console.log('Insert data:', insertData)
      
      const { data, error } = await supabaseAdmin
        .from('support_groups')
        .insert(insertData)
        .select('*')
        .single()

      console.log('=== ADMIN: Insert Response ===')
      console.log('Error:', error)
      console.log('Data:', data)

      if (error) {
        console.error('Supabase error creating support group:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('=== ADMIN: Support group created successfully ===')
      console.log('Created group:', data)
      
      // Verify it was actually saved by re-querying
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from('support_groups')
        .select('*')
        .eq('id', data.id)
        .single()
      
      console.log('=== ADMIN: Verification Query ===')
      console.log('Verify error:', verifyError)
      console.log('Verify data:', verifyData)
      
      return data
    } catch (error) {
      console.error('Error in createSupportGroup:', error)
      throw error
    }
  }

  async updateSupportGroup(id: string, updates: UpdateSupportGroupData): Promise<SupportGroup> {
    try {
      // Filter out visibility fields if they're not supported yet
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      // Add standard fields
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description  
      if (updates.is_private !== undefined) updateData.is_private = updates.is_private
      if (updates.is_confidential !== undefined) updateData.is_confidential = updates.is_confidential
      
      // Add visibility fields only if they're provided (for when DB columns exist)
      if (updates.visible_to_users !== undefined) updateData.visible_to_users = updates.visible_to_users
      if (updates.visible_to_counselors !== undefined) updateData.visible_to_counselors = updates.visible_to_counselors
      if (updates.visible_to_admins !== undefined) updateData.visible_to_admins = updates.visible_to_admins
      if (updates.visible_to_super_admins !== undefined) updateData.visible_to_super_admins = updates.visible_to_super_admins

      const { data, error } = await supabaseAdmin
        .from('support_groups')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating support group:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in updateSupportGroup:', error)
      throw error
    }
  }

  async deleteSupportGroup(id: string): Promise<void> {
    try {
      console.log('Starting deletion process for support group:', id)

      // 1. Remove all topics associated with this group
      const { error: topicsError } = await supabaseAdmin
        .from('topics')
        .delete()
        .eq('support_group_id', id)
      
      if (topicsError) {
        console.error('Error deleting topics:', topicsError)
        // Don't throw here - topics table might not exist
      }

      // 2. Remove all messages from this group
      const { error: messagesError } = await supabaseAdmin
        .from('messages')
        .delete()
        .eq('support_group_id', id)
      
      if (messagesError) {
        console.error('Error deleting messages:', messagesError)
        // Don't throw here - continue with other cleanup
      }

      // 3. Remove all members
      const { error: membersError } = await supabaseAdmin
        .from('support_group_members')
        .delete()
        .eq('support_group_id', id)

      if (membersError) {
        console.error('Error deleting members:', membersError)
        // Continue with cleanup
      }

      // 4. Remove all join requests
      const { error: requestsError } = await supabaseAdmin
        .from('support_group_join_requests')
        .delete()
        .eq('support_group_id', id)

      if (requestsError) {
        console.error('Error deleting join requests:', requestsError)
        // Continue with cleanup
      }

      // 5. Finally delete the group itself
      const { error } = await supabaseAdmin
        .from('support_groups')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting support group:', error)
        throw error
      }

      console.log('Support group deleted successfully:', id)
    } catch (error) {
      console.error('Error in deleteSupportGroup:', error)
      throw error
    }
  }

  async toggleGroupStatus(id: string, status: GroupStatus): Promise<SupportGroup> {
    try {
      return await this.updateSupportGroup(id, { 
        status,
        last_activity: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error in toggleGroupStatus:', error)
      throw error
    }
  }

  // Member Management
  async getGroupMembers(groupId: string): Promise<SupportGroupMember[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('support_group_members')
        .select(`
          id,
          support_group_id,
          user_id,
          role,
          joined_at,
          left_at,
          users(
            id,
            name,
            email,
            avatar
          )
        `)
        .eq('support_group_id', groupId)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('Error fetching group members:', error)
        throw error
      }

      // Transform the data to match the expected type
      const membersWithUserData = (data || []).map(member => ({
        ...member,
        user: Array.isArray(member.users) ? member.users[0] : member.users
      }))

      console.log('Group members fetched with user data:', membersWithUserData.length)
      return membersWithUserData as SupportGroupMember[]
    } catch (error) {
      console.error('Error in getGroupMembers:', error)
      throw error
    }
  }

  async addMember(groupId: string, userId: string, role: MemberRole = 'member'): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('support_group_members')
        .insert({
          support_group_id: groupId,
          user_id: userId,
          role,
          joined_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error adding member:', error)
        throw error
      }

      // Update member count
      await this.updateMemberCount(groupId)
    } catch (error) {
      console.error('Error in addMember:', error)
      throw error
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('support_group_members')
        .delete()
        .eq('support_group_id', groupId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error removing member:', error)
        throw error
      }

      // Update member count
      await this.updateMemberCount(groupId)
    } catch (error) {
      console.error('Error in removeMember:', error)
      throw error
    }
  }

  async updateMemberRole(groupId: string, userId: string, role: MemberRole): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('support_group_members')
        .update({ role })
        .eq('support_group_id', groupId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating member role:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in updateMemberRole:', error)
      throw error
    }
  }

  // Note: Moderator management is handled through the support_group_members table with role 'moderator'

  // Join Request Management
  async getJoinRequests(groupId?: string): Promise<JoinRequest[]> {
    try {
      console.log('Fetching join requests for group:', groupId || 'all groups')
      let query = supabaseAdmin
        .from('support_group_join_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (groupId) {
        query = query.eq('support_group_id', groupId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching join requests:', error)
        console.log('Returning empty array due to error')
        return []
      }

      console.log('Join requests fetched successfully:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error in getJoinRequests:', error)
      console.log('Returning empty array due to exception')
      return []
    }
  }

  async approveJoinRequest(requestId: string, reviewedBy: string): Promise<void> {
    try {
      // Get the request details
      const { data: request, error: requestError } = await supabaseAdmin
        .from('support_group_join_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (requestError) {
        console.error('Error fetching join request:', requestError)
        throw requestError
      }

      // Update request status
      const { error: updateError } = await supabaseAdmin
        .from('support_group_join_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy
        })
        .eq('id', requestId)

      if (updateError) {
        console.error('Error updating join request:', updateError)
        throw updateError
      }

      // Add user to group
      await this.addMember(request.support_group_id, request.user_id)
    } catch (error) {
      console.error('Error in approveJoinRequest:', error)
      throw error
    }
  }

  async rejectJoinRequest(requestId: string, reviewedBy: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('support_group_join_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewedBy
        })
        .eq('id', requestId)

      if (error) {
        console.error('Error rejecting join request:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in rejectJoinRequest:', error)
      throw error
    }
  }

  // Statistics and Analytics
  async getGroupStatistics(): Promise<GroupStatistics> {
    try {
      console.log('Attempting to call get_support_group_statistics RPC function...')
      const { data, error } = await supabaseAdmin.rpc('get_support_group_statistics')

      if (error) {
        console.error('RPC function error:', error)
        console.log('Falling back to basic statistics...')
        return await this.getBasicStatistics()
      }

      console.log('RPC function returned data:', data)
      return data
    } catch (error) {
      console.error('Error in getGroupStatistics:', error)
      console.log('Falling back to basic statistics...')
      return await this.getBasicStatistics()
    }
  }

  private async getBasicStatistics(): Promise<GroupStatistics> {
    try {
      // Get basic counts
      const { data: groups, error: groupsError } = await supabaseAdmin
        .from('support_groups')
        .select('id, status, category, country, language, member_count, created_at')

      if (groupsError) throw groupsError

      const total_groups = groups?.length || 0
      const active_groups = groups?.filter(g => g.status === 'active').length || 0
      const pending_groups = groups?.filter(g => g.status === 'pending').length || 0
      const total_members = groups?.reduce((sum, g) => sum + (g.member_count || 0), 0) || 0
      const avg_members_per_group = total_groups > 0 ? Math.round(total_members / total_groups) : 0

      // Calculate new groups this week
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const new_groups_this_week = groups?.filter(g => 
        g.created_at && new Date(g.created_at) > oneWeekAgo
      ).length || 0

      // Calculate groups approved today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const groups_approved_today = groups?.filter(g => 
        g.status === 'active' && g.created_at && new Date(g.created_at) > today
      ).length || 0

      // Group by category
      const groups_by_category = groups?.reduce((acc, g) => {
        if (g.category) {
          acc[g.category as SupportGroupCategory] = (acc[g.category as SupportGroupCategory] || 0) + 1
        }
        return acc
      }, {} as Record<SupportGroupCategory, number>) || {}

      // Group by country
      const groups_by_country = groups?.reduce((acc, g) => {
        if (g.country) {
          acc[g.country] = (acc[g.country] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}

      // Group by language
      const groups_by_language = groups?.reduce((acc, g) => {
        if (g.language) {
          acc[g.language] = (acc[g.language] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {}

      return {
        total_groups,
        active_groups,
        pending_groups,
        total_members,
        avg_members_per_group,
        new_groups_this_week,
        groups_approved_today,
        groups_by_category,
        groups_by_country,
        groups_by_language,
        recent_activity: []
      }
    } catch (error) {
      console.error('Error in getBasicStatistics:', error)
      // Return default stats if table doesn't exist
      return {
        total_groups: 0,
        active_groups: 0,
        pending_groups: 0,
        total_members: 0,
        avg_members_per_group: 0,
        new_groups_this_week: 0,
        groups_approved_today: 0,
        groups_by_category: {} as Record<SupportGroupCategory, number>,
        groups_by_country: {} as Record<string, number>,
        groups_by_language: {} as Record<string, number>,
        recent_activity: []
      }
    }
  }

  // Utility Methods
  private async updateMemberCount(groupId: string): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('support_group_members')
        .select('id')
        .eq('support_group_id', groupId)

      if (error) {
        console.error('Error counting members:', error)
        return
      }

      const memberCount = data?.length || 0

      await supabaseAdmin
        .from('support_groups')
        .update({ 
          member_count: memberCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
    } catch (error) {
      console.error('Error in updateMemberCount:', error)
    }
  }

  // Bulk Operations
  async bulkUpdateStatus(groupIds: string[], status: GroupStatus): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('support_groups')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', groupIds)

      if (error) {
        console.error('Error in bulk status update:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in bulkUpdateStatus:', error)
      throw error
    }
  }

  async bulkDelete(groupIds: string[]): Promise<void> {
    try {
      // Remove all related data first
      await supabaseAdmin.from('support_group_members').delete().in('group_id', groupIds)
      await supabaseAdmin.from('support_group_join_requests').delete().in('support_group_id', groupIds)

      // Delete the groups
      const { error } = await supabaseAdmin
        .from('support_groups')
        .delete()
        .in('id', groupIds)

      if (error) {
        console.error('Error in bulk delete:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in bulkDelete:', error)
      throw error
    }
  }

  // Export functionality
  async exportGroups(filters?: SupportGroupFilters): Promise<any[]> {
    try {
      const groups = await this.getAllSupportGroups(filters)
      
      return groups.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        category: group.category,
        type: group.type,
        status: group.status,
        country: group.country,
        region: group.region,
        city: group.city,
        language: group.language,
        meeting_type: group.meeting_type,
        meeting_schedule: group.meeting_schedule,
        member_count: group.member_count,
        is_private: group.is_private,
        is_confidential: group.is_confidential,
        requires_approval: group.requires_approval,
        max_members: group.max_members,
        created_at: group.created_at,
        created_by: group.created_by_user?.name || 'Unknown'
      }))
    } catch (error) {
      console.error('Error in exportGroups:', error)
      throw error
    }
  }

  // User Moderation Methods - simplified (database schema doesn't have ban/mute fields)
  async banUser(groupId: string, userId: string, reason?: string, moderatorId?: string): Promise<void> {
    // For now, just remove the user from the group
    await this.removeMember(groupId, userId)
  }

  async unbanUser(groupId: string, userId: string, moderatorId?: string): Promise<void> {
    // For now, just re-add the user to the group
    await this.addMember(groupId, userId)
  }

  async muteUser(groupId: string, userId: string, duration: string, reason?: string, moderatorId?: string): Promise<void> {
    // Database schema doesn't have mute fields, so this is a placeholder
    console.log(`Mute user ${userId} in group ${groupId} for ${duration} - feature not implemented in database`)
  }

  async unmuteUser(groupId: string, userId: string, moderatorId?: string): Promise<void> {
    // Database schema doesn't have mute fields, so this is a placeholder
    console.log(`Unmute user ${userId} in group ${groupId} - feature not implemented in database`)
  }

  async getModerationHistory(groupId: string): Promise<ModerationAction[]> {
    const { data, error } = await supabase
      .from('support_group_moderation_actions')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting moderation history:', error)
      throw error
    }

    return data || []
  }

  private async logModerationAction(
    groupId: string, 
    userId: string, 
    actionType: 'ban' | 'mute' | 'unban' | 'unmute',
    duration?: MuteDuration,
    reason?: string,
    moderatorId?: string,
    expiresAt?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('support_group_moderation_actions')
      .insert({
        group_id: groupId,
        user_id: userId,
        action_type: actionType,
        duration: duration,
        reason: reason,
        moderator_id: moderatorId,
        expires_at: expiresAt
      })

    if (error) {
      console.error('Error logging moderation action:', error)
      // Don't throw here as this is a logging operation
    }
  }

  private calculateMuteExpiry(duration: MuteDuration): string {
    const now = new Date()
    
    switch (duration) {
      case '1hour':
        now.setHours(now.getHours() + 1)
        break
      case '1day':
        now.setDate(now.getDate() + 1)
        break
      case '1week':
        now.setDate(now.getDate() + 7)
        break
      case '1month':
        now.setMonth(now.getMonth() + 1)
        break
      case '3months':
        now.setMonth(now.getMonth() + 3)
        break
      case '6months':
        now.setMonth(now.getMonth() + 6)
        break
      case '1year':
        now.setFullYear(now.getFullYear() + 1)
        break
    }
    
    return now.toISOString()
  }
}

export const supportGroupsService = new SupportGroupsService() 