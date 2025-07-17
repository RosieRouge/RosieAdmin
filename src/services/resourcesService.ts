import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { PublicResource, ResourceCategory } from '@/types'

export interface AdminResourceFilters {
  category?: ResourceCategory
  search?: string
  tags?: string[]
  language?: string
  is_public?: boolean
  approved?: boolean
  author_id?: string
  date_range?: {
    start: string
    end: string
  }
}

export interface CreateResourceData {
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
}

export interface UpdateResourceData extends Partial<CreateResourceData> {
  approved_by_id?: string
  approved_at?: string
}

export interface ResourceUploadData {
  file: File
  title: string
  description?: string
  category: ResourceCategory
  tags: string[]
  language: string
  is_public: boolean
  downloadable: boolean
}

export class AdminResourcesService {
  /**
   * Get all resources with admin filters
   */
  static async getAllResources(filters?: AdminResourceFilters): Promise<PublicResource[]> {
    try {
      console.log('AdminResourcesService: Attempting to fetch resources from public_resources table...')
      
      let query = supabaseAdmin
        .from('public_resources')
        .select(`
          *,
          author:users!author_id(id, name, email, role),
          approved_by:users!approved_by_id(id, name, email, role)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
      }

      if (filters?.language) {
        query = query.eq('language', filters.language)
      }

      if (filters?.is_public !== undefined) {
        query = query.eq('is_public', filters.is_public)
      }

      if (filters?.approved !== undefined) {
        if (filters.approved) {
          query = query.not('approved_at', 'is', null)
        } else {
          query = query.is('approved_at', null)
        }
      }

      if (filters?.author_id) {
        query = query.eq('author_id', filters.author_id)
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      if (filters?.date_range) {
        query = query.gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end)
      }

      // Include soft-deleted resources for admin
      if (!filters?.search?.includes('deleted')) {
        query = query.is('deleted_at', null)
      }

      console.log('AdminResourcesService: Executing query...')
      const { data, error } = await query

      if (error) {
        console.error('AdminResourcesService: Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Check if it's a table not found error
        if (error.message.includes('relation "public_resources" does not exist') || 
            error.code === 'PGRST106' || 
            error.code === '42P01') {
          console.error('AdminResourcesService: public_resources table does not exist in database')
          console.log('AdminResourcesService: Attempting fallback to resources table...')
          
          // Try fallback to 'resources' table
          try {
            const fallbackQuery = supabaseAdmin
              .from('resources')
              .select('*')
              .order('created_at', { ascending: false })
              
            const { data: fallbackData, error: fallbackError } = await fallbackQuery
            
            if (fallbackError) {
              console.error('AdminResourcesService: Fallback to resources table also failed:', fallbackError)
              throw new Error(`Database table not found: Neither public_resources nor resources table exists`)
            }
            
            console.log('AdminResourcesService: Successfully retrieved data from resources table')
            return fallbackData || []
          } catch (fallbackErr) {
            console.error('AdminResourcesService: Fallback failed:', fallbackErr)
            throw new Error('Resources table not found in database. Please run the database setup scripts.')
          }
        }
        
        throw new Error(`Failed to fetch resources: ${error.message}`)
      }

      console.log('AdminResourcesService: Successfully retrieved resources:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('AdminResourcesService.getAllResources error:', error)
      throw error
    }
  }

  /**
   * Get a single resource by ID (admin view)
   */
  static async getResource(id: string): Promise<PublicResource | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('public_resources')
        .select(`
          *,
          author:users!author_id(id, name, email, role),
          approved_by:users!approved_by_id(id, name, email, role)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching resource:', error)
        throw new Error(`Failed to fetch resource: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('AdminResourcesService.getResource error:', error)
      throw error
    }
  }

  /**
   * Create a new resource
   */
  static async createResource(resourceData: CreateResourceData, authorId: string): Promise<PublicResource> {
    try {
      const { data, error } = await supabaseAdmin
        .from('public_resources')
        .insert({
          ...resourceData,
          author_id: authorId,
          view_count: 0,
          download_count: 0
        })
        .select(`
          *,
          author:users!author_id(id, name, email, role),
          approved_by:users!approved_by_id(id, name, email, role)
        `)
        .single()

      if (error) {
        console.error('Error creating resource:', error)
        throw new Error(`Failed to create resource: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('AdminResourcesService.createResource error:', error)
      throw error
    }
  }

  /**
   * Update a resource
   */
  static async updateResource(id: string, updates: UpdateResourceData): Promise<PublicResource> {
    try {
      const { data, error } = await supabaseAdmin
        .from('public_resources')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          author:users!author_id(id, name, email, role),
          approved_by:users!approved_by_id(id, name, email, role)
        `)
        .single()

      if (error) {
        console.error('Error updating resource:', error)
        throw new Error(`Failed to update resource: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('AdminResourcesService.updateResource error:', error)
      throw error
    }
  }

  /**
   * Delete a resource (soft delete)
   */
  static async deleteResource(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('public_resources')
        .update({
          deleted_at: new Date().toISOString(),
          is_public: false
        })
        .eq('id', id)

      if (error) {
        console.error('Error deleting resource:', error)
        throw new Error(`Failed to delete resource: ${error.message}`)
      }
    } catch (error) {
      console.error('AdminResourcesService.deleteResource error:', error)
      throw error
    }
  }

  /**
   * Permanently delete a resource
   */
  static async permanentlyDeleteResource(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('public_resources')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error permanently deleting resource:', error)
        throw new Error(`Failed to permanently delete resource: ${error.message}`)
      }
    } catch (error) {
      console.error('AdminResourcesService.permanentlyDeleteResource error:', error)
      throw error
    }
  }

  /**
   * Restore a soft-deleted resource
   */
  static async restoreResource(id: string): Promise<PublicResource> {
    try {
      const { data, error } = await supabaseAdmin
        .from('public_resources')
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          author:users!author_id(id, name, email, role),
          approved_by:users!approved_by_id(id, name, email, role)
        `)
        .single()

      if (error) {
        console.error('Error restoring resource:', error)
        throw new Error(`Failed to restore resource: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('AdminResourcesService.restoreResource error:', error)
      throw error
    }
  }

  /**
   * Approve a resource
   */
  static async approveResource(id: string, approvedById: string): Promise<PublicResource> {
    try {
      const { data, error } = await supabaseAdmin
        .from('public_resources')
        .update({
          approved_by_id: approvedById,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          author:users!author_id(id, name, email, role),
          approved_by:users!approved_by_id(id, name, email, role)
        `)
        .single()

      if (error) {
        console.error('Error approving resource:', error)
        throw new Error(`Failed to approve resource: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('AdminResourcesService.approveResource error:', error)
      throw error
    }
  }

  /**
   * Unapprove a resource
   */
  static async unapproveResource(id: string): Promise<PublicResource> {
    try {
      const { data, error } = await supabaseAdmin
        .from('public_resources')
        .update({
          approved_by_id: null,
          approved_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          author:users!author_id(id, name, email, role),
          approved_by:users!approved_by_id(id, name, email, role)
        `)
        .single()

      if (error) {
        console.error('Error unapproving resource:', error)
        throw new Error(`Failed to unapprove resource: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('AdminResourcesService.unapproveResource error:', error)
      throw error
    }
  }

  /**
   * Upload a file to Supabase Storage
   */
  static async uploadFile(file: File, folder: string = 'resources'): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('AdminResourcesService.uploadFile error:', error)
      throw error
    }
  }

  /**
   * Create resource with file upload
   */
  static async createResourceWithFile(
    uploadData: ResourceUploadData,
    authorId: string
  ): Promise<PublicResource> {
    try {
      // Upload file first
      const fileUrl = await this.uploadFile(uploadData.file)

      // Create resource with file URL
      const resourceData: CreateResourceData = {
        title: uploadData.title,
        description: uploadData.description || '',
        content: uploadData.description || uploadData.title,
        category: uploadData.category,
        tags: uploadData.tags,
        language: uploadData.language,
        is_public: uploadData.is_public,
        downloadable: uploadData.downloadable,
        file_url: fileUrl
      }

      return await this.createResource(resourceData, authorId)
    } catch (error) {
      console.error('AdminResourcesService.createResourceWithFile error:', error)
      throw error
    }
  }

  /**
   * Get resource statistics
   */
  static async getResourceStatistics(): Promise<{
    total: number
    published: number
    draft: number
    approved: number
    pending: number
    deleted: number
    totalViews: number
    totalDownloads: number
    categoryCounts: Record<string, number>
    languageCounts: Record<string, number>
  }> {
    try {
      console.log('AdminResourcesService: Fetching resource statistics...')
      
      const { data, error } = await supabaseAdmin
        .from('public_resources')
        .select('*')

      if (error) {
        console.error('AdminResourcesService: Statistics error:', error)
        
        // Check if it's a table not found error
        if (error.message.includes('relation "public_resources" does not exist') || 
            error.code === 'PGRST106' || 
            error.code === '42P01') {
          console.log('AdminResourcesService: public_resources table not found, trying resources table...')
          
          // Try fallback to 'resources' table
          try {
            const { data: fallbackData, error: fallbackError } = await supabaseAdmin
              .from('resources')
              .select('*')
              
            if (fallbackError) {
              console.error('AdminResourcesService: Fallback statistics failed:', fallbackError)
              // Return default statistics
              return {
                total: 0,
                published: 0,
                draft: 0,
                approved: 0,
                pending: 0,
                deleted: 0,
                totalViews: 0,
                totalDownloads: 0,
                categoryCounts: {},
                languageCounts: {}
              }
            }
            
            const resources = fallbackData || []
            console.log('AdminResourcesService: Using fallback data for statistics')
            
            // Calculate stats with fallback data (simplified structure)
            return {
              total: resources.length,
              published: resources.filter(r => r.is_public && !r.deleted_at).length,
              draft: resources.filter(r => !r.is_public && !r.deleted_at).length,
              approved: resources.filter(r => r.approved_at && !r.deleted_at).length,
              pending: resources.filter(r => !r.approved_at && !r.deleted_at).length,
              deleted: resources.filter(r => r.deleted_at).length,
              totalViews: resources.reduce((sum, r) => sum + (r.view_count || 0), 0),
              totalDownloads: resources.reduce((sum, r) => sum + (r.download_count || 0), 0),
              categoryCounts: {},
              languageCounts: {}
            }
          } catch (fallbackErr) {
            console.error('AdminResourcesService: Fallback statistics failed:', fallbackErr)
          }
        }
        
        // Return default statistics on any error
        return {
          total: 0,
          published: 0,
          draft: 0,
          approved: 0,
          pending: 0,
          deleted: 0,
          totalViews: 0,
          totalDownloads: 0,
          categoryCounts: {},
          languageCounts: {}
        }
      }

      const resources = data || []
      const total = resources.length
      const published = resources.filter(r => r.is_public && !r.deleted_at).length
      const draft = resources.filter(r => !r.is_public && !r.deleted_at).length
      const approved = resources.filter(r => r.approved_at && !r.deleted_at).length
      const pending = resources.filter(r => !r.approved_at && !r.deleted_at).length
      const deleted = resources.filter(r => r.deleted_at).length
      const totalViews = resources.reduce((sum, r) => sum + (r.view_count || 0), 0)
      const totalDownloads = resources.reduce((sum, r) => sum + (r.download_count || 0), 0)

      const categoryCounts = resources
        .filter(r => !r.deleted_at)
        .reduce((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)

      const languageCounts = resources
        .filter(r => !r.deleted_at)
        .reduce((acc, r) => {
          acc[r.language] = (acc[r.language] || 0) + 1
          return acc
        }, {} as Record<string, number>)

      console.log('AdminResourcesService: Statistics calculated successfully')
      return {
        total,
        published,
        draft,
        approved,
        pending,
        deleted,
        totalViews,
        totalDownloads,
        categoryCounts,
        languageCounts
      }
    } catch (error) {
      console.error('AdminResourcesService.getResourceStatistics error:', error)
      
      // Return default statistics on any error
      return {
        total: 0,
        published: 0,
        draft: 0,
        approved: 0,
        pending: 0,
        deleted: 0,
        totalViews: 0,
        totalDownloads: 0,
        categoryCounts: {},
        languageCounts: {}
      }
    }
  }

  /**
   * Bulk operations
   */
  static async bulkUpdateResources(
    ids: string[],
    updates: Partial<UpdateResourceData>
  ): Promise<PublicResource[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('public_resources')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .select(`
          *,
          author:users!author_id(id, name, email, role),
          approved_by:users!approved_by_id(id, name, email, role)
        `)

      if (error) {
        console.error('Error bulk updating resources:', error)
        throw new Error(`Failed to bulk update resources: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('AdminResourcesService.bulkUpdateResources error:', error)
      throw error
    }
  }

  /**
   * Bulk delete resources
   */
  static async bulkDeleteResources(ids: string[]): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('public_resources')
        .update({
          deleted_at: new Date().toISOString(),
          is_public: false
        })
        .in('id', ids)

      if (error) {
        console.error('Error bulk deleting resources:', error)
        throw new Error(`Failed to bulk delete resources: ${error.message}`)
      }
    } catch (error) {
      console.error('AdminResourcesService.bulkDeleteResources error:', error)
      throw error
    }
  }

  /**
   * Get resource categories with counts
   */
  static async getResourceCategories(): Promise<Array<{ category: ResourceCategory; count: number }>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('public_resources')
        .select('category')
        .is('deleted_at', null)

      if (error) {
        console.error('Error fetching resource categories:', error)
        throw new Error(`Failed to fetch categories: ${error.message}`)
      }

      // Count resources by category
      const categoryCounts = data.reduce((acc, resource) => {
        const category = resource.category as ResourceCategory
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<ResourceCategory, number>)

      return Object.entries(categoryCounts).map(([category, count]) => ({
        category: category as ResourceCategory,
        count
      }))
    } catch (error) {
      console.error('AdminResourcesService.getResourceCategories error:', error)
      throw error
    }
  }
} 