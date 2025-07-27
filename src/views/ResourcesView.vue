<template>
  <div class="resources-admin admin-view" :class="viewClasses">
    <!-- Header with Statistics -->
    <div class="header-section">
      <div class="header-content">
        <h1>
          <i class="fas fa-book-medical"></i>
          Resources Management
        </h1>
        <p>Manage educational materials and support resources</p>
      </div>
      <div class="header-actions">
        <button @click="openCreateModal" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          Add Resource
        </button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon published">
          <i class="fas fa-eye"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.published }}</h3>
          <p>Published</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.pending }}</h3>
          <p>Pending Approval</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon views">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalViews.toLocaleString() }}</h3>
          <p>Total Views</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon downloads">
          <i class="fas fa-download"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalDownloads.toLocaleString() }}</h3>
          <p>Total Downloads</p>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Search resources..."
          @input="debouncedSearch"
        >
      </div>
      
      <div class="filters">
        <select v-model="filters.category" @change="applyFilters">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ formatCategory(category) }}
          </option>
        </select>

        <select v-model="filters.language" @change="applyFilters">
          <option value="">All Languages</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="pt">Portuguese</option>
        </select>

        <select v-model="filters.is_public" @change="applyFilters">
          <option value="">All Status</option>
          <option :value="true">Published</option>
          <option :value="false">Draft</option>
        </select>

        <select v-model="filters.approved" @change="applyFilters">
          <option value="">All Approval Status</option>
          <option :value="true">Approved</option>
          <option :value="false">Pending</option>
        </select>
      </div>

      <div class="bulk-actions" v-if="selectedResources.length > 0">
        <span class="selection-count">{{ selectedResources.length }} selected</span>
        <button @click="bulkApprove" class="btn btn-success btn-sm">
          <i class="fas fa-check"></i>
          Approve
        </button>
        <button @click="bulkUnpublish" class="btn btn-warning btn-sm">
          <i class="fas fa-eye-slash"></i>
          Unpublish
        </button>
        <button @click="bulkDelete" class="btn btn-danger btn-sm">
          <i class="fas fa-trash"></i>
          Delete
        </button>
      </div>
    </div>

    <!-- Resources Table -->
    <div class="resources-table">
      <div class="table-header">
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            :checked="allSelected"
            @change="toggleSelectAll"
          >
          <span class="checkmark"></span>
        </label>
        <span class="col-title">Title</span>
        <span class="col-category">Category</span>
        <span class="col-status">Status</span>
        <span class="col-stats">Stats</span>
        <span class="col-actions">Actions</span>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        Loading resources...
      </div>

      <div v-else-if="filteredResources.length === 0" class="empty-state">
        <i class="fas fa-folder-open"></i>
        <h3>No resources found</h3>
        <p>Try adjusting your search or filters</p>
      </div>

      <div v-else class="table-body">
        <div 
          v-for="resource in filteredResources" 
          :key="resource.id"
          class="resource-row"
          :class="{ 
            selected: selectedResources.includes(resource.id),
            deleted: resource.deleted_at 
          }"
        >
          <label class="checkbox-container">
            <input 
              type="checkbox" 
              :checked="selectedResources.includes(resource.id)"
              @change="toggleSelect(resource.id)"
            >
            <span class="checkmark"></span>
          </label>

          <div class="resource-info">
            <div class="resource-title">
              <h4>{{ resource.title }}</h4>
              <p v-if="resource.description">{{ resource.description }}</p>
            </div>
            <div class="resource-meta">
              <span class="author">by {{ resource.author?.name || 'Unknown' }}</span>
              <span class="date">{{ formatDate(resource.created_at) }}</span>
              <span v-if="resource.file_url" class="file-type">
                <i class="fas fa-file"></i>
                {{ getFileType(resource.file_url) }}
              </span>
            </div>
          </div>

          <div class="resource-category">
            <span class="category-badge" :class="resource.category">
              <i :class="getCategoryIcon(resource.category)"></i>
              {{ formatCategory(resource.category) }}
            </span>
          </div>

          <div class="resource-status">
            <span class="status-badge" :class="getStatusClass(resource)">
              {{ getStatusText(resource) }}
            </span>
            <span v-if="resource.approved_at" class="approval-info">
              <i class="fas fa-check-circle"></i>
              Approved by {{ resource.approved_by?.name }}
            </span>
          </div>

          <div class="resource-stats">
            <div class="stat-item">
              <i class="fas fa-eye"></i>
              {{ resource.view_count || 0 }}
            </div>
            <div class="stat-item">
              <i class="fas fa-download"></i>
              {{ resource.download_count || 0 }}
            </div>
          </div>

          <div class="resource-actions">
            <button @click="editResource(resource)" class="btn-icon" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button 
              v-if="!resource.approved_at" 
              @click="approveResource(resource)" 
              class="btn-icon approve" 
              title="Approve"
            >
              <i class="fas fa-check"></i>
            </button>
            <button 
              v-if="resource.approved_at" 
              @click="unapproveResource(resource)" 
              class="btn-icon unapprove" 
              title="Unapprove"
            >
              <i class="fas fa-times"></i>
            </button>
            <button 
              v-if="resource.file_url" 
              @click="downloadFile(resource)" 
              class="btn-icon download" 
              title="Download"
            >
              <i class="fas fa-download"></i>
            </button>
            <button 
              @click="deleteResource(resource)" 
              class="btn-icon delete" 
              title="Delete"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Resource Modal -->
    <div v-if="showResourceModal" class="modal-overlay" @click="showResourceModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingResource ? 'Edit Resource' : 'Create New Resource' }}</h3>
          <button @click="showResourceModal = false" class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Resource Type Selection -->
          <div v-if="!editingResource" class="form-group">
            <label>Resource Type *</label>
            <div class="resource-type-grid">
              <div 
                v-for="type in resourceTypes" 
                :key="type.value"
                class="resource-type-option"
                :class="{ active: selectedResourceType === type.value }"
                @click="selectedResourceType = type.value"
              >
                <i :class="type.icon"></i>
                <span>{{ type.label }}</span>
              </div>
            </div>
          </div>

          <form @submit.prevent="saveResource">
            <div class="form-group">
              <label>Title *</label>
              <input 
                v-model="resourceForm.title" 
                type="text" 
                required 
                placeholder="Resource title"
              >
            </div>
            
            <div class="form-group">
              <label>Description</label>
              <textarea 
                v-model="resourceForm.description" 
                rows="3" 
                placeholder="Brief description"
              ></textarea>
            </div>

            <!-- File Upload Section -->
            <div v-if="selectedResourceType === 'file'" class="form-group">
              <label>File Upload *</label>
              <div class="file-upload-area" @drop="handleFileDrop" @dragover.prevent @dragenter.prevent>
                <input 
                  ref="fileInput"
                  type="file" 
                  @change="handleFileSelect"
                  accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                  style="display: none"
                >
                <div v-if="!uploadFile" class="upload-placeholder" @click="($refs.fileInput as HTMLInputElement)?.click()">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <p>Drop files here or click to select</p>
                  <small>Supports: PDF, DOC, TXT, MP3, MP4, Images</small>
                </div>
                <div v-else class="file-preview">
                  <i class="fas fa-file"></i>
                  <span>{{ uploadFile.name }}</span>
                  <button type="button" @click="uploadFile = null" class="remove-file">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- External URL Section -->
            <div v-if="selectedResourceType === 'link'" class="form-group">
              <label>External URL *</label>
              <input 
                v-model="resourceForm.external_url" 
                type="url" 
                required 
                placeholder="https://example.com"
              >
            </div>

            <!-- Content Section -->
            <div v-if="selectedResourceType === 'article'" class="form-group">
              <label>Content *</label>
              <textarea 
                v-model="resourceForm.content" 
                rows="6" 
                required 
                placeholder="Resource content"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Category *</label>
                <select v-model="resourceForm.category" required>
                  <option value="">Select category</option>
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ formatCategory(category) }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Language</label>
                <select v-model="resourceForm.language">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Tags</label>
              <input 
                v-model="resourceFormTags" 
                type="text" 
                placeholder="Enter tags separated by commas"
              >
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="resourceForm.is_public">
                <span class="checkmark"></span>
                Publish immediately
              </label>
              <label v-if="selectedResourceType === 'file'" class="checkbox-label">
                <input type="checkbox" v-model="resourceForm.downloadable">
                <span class="checkmark"></span>
                Allow downloads
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" @click="showResourceModal = false" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="savingResource">
                <i v-if="savingResource" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                {{ editingResource ? 'Update Resource' : 'Create Resource' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useResponsiveLayout } from '@/composables/useResponsiveLayout'
import { useAuthStore } from '@/stores/auth'
import { AdminResourcesService } from '@/services/resourcesService'
import type { PublicResource, ResourceCategory } from '@/types'
import type { AdminResourceFilters, CreateResourceData, ResourceUploadData } from '@/services/resourcesService'

const authStore = useAuthStore()

// Responsive layout
const { viewClasses, setupResponsiveLayout } = useResponsiveLayout()

// State
const loading = ref(true)
const resources = ref<PublicResource[]>([])
const selectedResources = ref<string[]>([])
const showResourceModal = ref(false)
const editingResource = ref<PublicResource | null>(null)
const savingResource = ref(false)
const uploadFile = ref<File | null>(null)
const selectedResourceType = ref<'article' | 'file' | 'link' | 'video' | 'document'>('article')

// Statistics
const stats = ref({
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
})

// Filters
const filters = ref<AdminResourceFilters>({
  search: '',
  category: undefined,
  language: '',
  is_public: undefined,
  approved: undefined
})

// Form data
const resourceForm = ref<CreateResourceData>({
  title: '',
  description: '',
  content: '',
  category: '' as ResourceCategory,
  tags: [],
  language: 'en',
  is_public: true,
  downloadable: false,
  external_url: ''
})

const resourceFormTags = ref('')

// Categories
const categories = [
  'legal',
  'financial', 
  'medical',
  'emotional',
  'safety',
  'educational'
] as const

// Resource types
const resourceTypes = [
  { value: 'article', label: 'Article/Text Content', icon: 'fas fa-file-alt' },
  { value: 'file', label: 'File Upload', icon: 'fas fa-file-upload' },
  { value: 'link', label: 'External Link', icon: 'fas fa-external-link-alt' },
  { value: 'video', label: 'Video Content', icon: 'fas fa-video' },
  { value: 'document', label: 'Document/PDF', icon: 'fas fa-file-pdf' }
] as const

// Computed
const filteredResources = computed(() => {
  let filtered = resources.value

  if (filters.value.search) {
    const query = filters.value.search.toLowerCase()
    filtered = filtered.filter(resource => 
      resource.title.toLowerCase().includes(query) ||
      (resource.description && resource.description.toLowerCase().includes(query)) ||
      resource.content.toLowerCase().includes(query)
    )
  }

  if (filters.value.category) {
    filtered = filtered.filter(resource => resource.category === filters.value.category)
  }

  if (filters.value.language) {
    filtered = filtered.filter(resource => resource.language === filters.value.language)
  }

  if (filters.value.is_public !== undefined) {
    filtered = filtered.filter(resource => resource.is_public === filters.value.is_public)
  }

  if (filters.value.approved !== undefined) {
    if (filters.value.approved) {
      filtered = filtered.filter(resource => resource.approved_at)
    } else {
      filtered = filtered.filter(resource => !resource.approved_at)
    }
  }

  return filtered
})

const allSelected = computed(() => {
  return filteredResources.value.length > 0 && 
         selectedResources.value.length === filteredResources.value.length
})

// Methods
const loadResources = async () => {
  try {
    loading.value = true
    resources.value = await AdminResourcesService.getAllResources()
    await loadStatistics()
  } catch (error) {
    console.error('Failed to load resources:', error)
    // Handle error (show toast, etc.)
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    stats.value = await AdminResourcesService.getResourceStatistics()
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

const applyFilters = () => {
  // Filters are reactive, so this will automatically update filteredResources
  selectedResources.value = []
}

const debouncedSearch = (() => {
  let timeout: NodeJS.Timeout
  return () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      applyFilters()
    }, 300)
  }
})()

const toggleSelect = (id: string) => {
  const index = selectedResources.value.indexOf(id)
  if (index > -1) {
    selectedResources.value.splice(index, 1)
  } else {
    selectedResources.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedResources.value = []
  } else {
    selectedResources.value = filteredResources.value.map(r => r.id)
  }
}

const saveResource = async () => {
  try {
    savingResource.value = true
    
    // Parse tags
    resourceForm.value.tags = resourceFormTags.value
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0)

    if (editingResource.value) {
      // Update existing resource
      await AdminResourcesService.updateResource(editingResource.value.id, resourceForm.value)
    } else {
      // Create new resource based on type
      if (selectedResourceType.value === 'file' && uploadFile.value) {
        // Upload file and create resource
        const fileUrl = await AdminResourcesService.uploadFile(uploadFile.value)
        resourceForm.value.file_url = fileUrl
        resourceForm.value.downloadable = true
      }
      
      await AdminResourcesService.createResource(resourceForm.value, authStore.user?.id || '')
    }
    
    showResourceModal.value = false
    resetResourceForm()
    await loadResources()
  } catch (error) {
    console.error('Failed to save resource:', error)
    // Handle error
  } finally {
    savingResource.value = false
  }
}

const openCreateModal = () => {
  editingResource.value = null
  resetResourceForm()
  selectedResourceType.value = 'article'
  showResourceModal.value = true
}

const resetResourceForm = () => {
  resourceForm.value = {
    title: '',
    description: '',
    content: '',
    category: '' as ResourceCategory,
    tags: [],
    language: 'en',
    is_public: true,
    downloadable: false,
    external_url: ''
  }
  resourceFormTags.value = ''
  uploadFile.value = null
}

const editResource = (resource: PublicResource) => {
  editingResource.value = resource
  resourceForm.value = {
    title: resource.title,
    description: resource.description || '',
    content: resource.content,
    category: resource.category,
    tags: resource.tags,
    language: resource.language,
    is_public: resource.is_public,
    downloadable: resource.downloadable,
    external_url: resource.external_url || ''
  }
  resourceFormTags.value = resource.tags.join(', ')
  selectedResourceType.value = resource.file_url ? 'file' : resource.external_url ? 'link' : 'article'
  showResourceModal.value = true
}

const approveResource = async (resource: PublicResource) => {
  try {
    await AdminResourcesService.approveResource(resource.id, authStore.user?.id || '')
    await loadResources()
  } catch (error) {
    console.error('Failed to approve resource:', error)
  }
}

const unapproveResource = async (resource: PublicResource) => {
  try {
    await AdminResourcesService.unapproveResource(resource.id)
    await loadResources()
  } catch (error) {
    console.error('Failed to unapprove resource:', error)
  }
}

const deleteResource = async (resource: PublicResource) => {
  if (!confirm(`Are you sure you want to delete "${resource.title}"?`)) return

  try {
    await AdminResourcesService.deleteResource(resource.id)
    await loadResources()
  } catch (error) {
    console.error('Failed to delete resource:', error)
  }
}

const downloadFile = (resource: PublicResource) => {
  if (resource.file_url) {
    window.open(resource.file_url, '_blank')
  }
}

const bulkApprove = async () => {
  if (!confirm(`Approve ${selectedResources.value.length} resources?`)) return

  try {
    for (const id of selectedResources.value) {
      await AdminResourcesService.approveResource(id, authStore.user?.id || '')
    }
    selectedResources.value = []
    await loadResources()
  } catch (error) {
    console.error('Failed to bulk approve:', error)
  }
}

const bulkUnpublish = async () => {
  if (!confirm(`Unpublish ${selectedResources.value.length} resources?`)) return

  try {
    await AdminResourcesService.bulkUpdateResources(selectedResources.value, { is_public: false })
    selectedResources.value = []
    await loadResources()
  } catch (error) {
    console.error('Failed to bulk unpublish:', error)
  }
}

const bulkDelete = async () => {
  if (!confirm(`Delete ${selectedResources.value.length} resources?`)) return

  try {
    await AdminResourcesService.bulkDeleteResources(selectedResources.value)
    selectedResources.value = []
    await loadResources()
  } catch (error) {
    console.error('Failed to bulk delete:', error)
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    uploadFile.value = target.files[0]
  }
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    uploadFile.value = event.dataTransfer.files[0]
  }
}



// Utility functions
const formatCategory = (category: string) => {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const getCategoryIcon = (category: string) => {
  const icons = {
    legal: 'fas fa-gavel',
    financial: 'fas fa-dollar-sign',
    medical: 'fas fa-stethoscope',
    emotional: 'fas fa-heart',
    safety: 'fas fa-shield-alt',
    educational: 'fas fa-graduation-cap'
  }
  return icons[category as keyof typeof icons] || 'fas fa-file-alt'
}

const getStatusClass = (resource: PublicResource) => {
  if (resource.deleted_at) return 'deleted'
  if (!resource.is_public) return 'draft'
  if (!resource.approved_at) return 'pending'
  return 'published'
}

const getStatusText = (resource: PublicResource) => {
  if (resource.deleted_at) return 'Deleted'
  if (!resource.is_public) return 'Draft'
  if (!resource.approved_at) return 'Pending'
  return 'Published'
}

const getFileType = (url: string) => {
  const extension = url.split('.').pop()?.toLowerCase()
  return extension?.toUpperCase() || 'FILE'
}

// Watch for filter changes
watch(filters, () => {
  selectedResources.value = []
}, { deep: true })

// Initialize
onMounted(() => {
  loadResources()
})
</script>

<style scoped>
.resources-admin {
  padding: 2rem;
  background: #FDE2E2;
  min-height: 100vh;
  position: fixed;
  top: 60px;
  left: 280px;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  transition: left 0.3s ease, padding 0.3s ease;
}

/* Responsive layout adjustments */
@media (max-width: 1023px) {
  .resources-admin {
    left: 0 !important;
    top: 80px !important; /* Mobile header height */
    bottom: 80px !important; /* Mobile bottom nav */
    padding: 1rem !important;
  }
}

/* Sidebar state detection */
@media (min-width: 1024px) {
  /* When sidebar is collapsed (70px wide) */
  .resources-admin.sidebar-collapsed {
    left: 70px;
  }
}

/* Header Section */
.header-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 12px rgba(185, 28, 28, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  color: var(--rosie-primary);
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-content p {
  color: var(--rosie-gray);
  margin: 0;
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-icon.published { background: #10b981; }
.stat-icon.pending { background: #f59e0b; }
.stat-icon.views { background: #3b82f6; }
.stat-icon.downloads { background: #8b5cf6; }

.stat-content h3 {
  margin: 0 0 0.25rem 0;
  color: var(--rosie-primary);
  font-size: 1.8rem;
  font-weight: 700;
}

.stat-content p {
  margin: 0;
  color: var(--rosie-gray);
  font-size: 0.9rem;
}

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
}

.search-bar {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-bar i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--rosie-gray);
}

.search-bar input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-bar input:focus {
  outline: none;
  border-color: var(--rosie-primary);
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.filters select {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  min-width: 150px;
}

.filters select:focus {
  outline: none;
  border-color: var(--rosie-primary);
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--rosie-bg);
  border-radius: 8px;
  border: 2px solid var(--rosie-primary);
}

.selection-count {
  color: var(--rosie-primary);
  font-weight: 600;
}

/* Resources Table */
.resources-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(185, 28, 28, 0.1);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 50px 1fr 150px 120px 100px 120px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--rosie-bg);
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  color: var(--rosie-primary);
  align-items: center;
}

.table-body {
  max-height: 600px;
  overflow-y: auto;
}

.resource-row {
  display: grid;
  grid-template-columns: 50px 1fr 150px 120px 100px 120px;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  transition: background-color 0.2s;
}

.resource-row:hover {
  background: #fafafa;
}

.resource-row.selected {
  background: var(--rosie-bg);
}

.resource-row.deleted {
  opacity: 0.6;
  background: #fee2e2;
}

.resource-info {
  min-width: 0;
}

.resource-title h4 {
  margin: 0 0 0.25rem 0;
  color: var(--rosie-primary);
  font-size: 1rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-title p {
  margin: 0;
  color: var(--rosie-gray);
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--rosie-gray);
}

.resource-meta .author {
  font-weight: 500;
}

.resource-meta .file-type {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--rosie-primary);
}

.category-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.category-badge.legal { background: #3b82f6; }
.category-badge.financial { background: #10b981; }
.category-badge.medical { background: #8b5cf6; }
.category-badge.emotional { background: #f59e0b; }
.category-badge.safety { background: #dc2626; }
.category-badge.educational { background: #06b6d4; }

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.published {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.draft {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.pending {
  background: #fed7aa;
  color: #9a3412;
}

.status-badge.deleted {
  background: #fecaca;
  color: #991b1b;
}

.approval-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #10b981;
  margin-top: 0.25rem;
}

.resource-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--rosie-gray);
}

.resource-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-icon:hover {
  transform: translateY(-1px);
}

.btn-icon {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-icon:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-icon.approve {
  background: #d1fae5;
  color: #065f46;
}

.btn-icon.approve:hover {
  background: #a7f3d0;
}

.btn-icon.unapprove {
  background: #fed7aa;
  color: #9a3412;
}

.btn-icon.unapprove:hover {
  background: #fdba74;
}

.btn-icon.download {
  background: #dbeafe;
  color: #1e40af;
}

.btn-icon.download:hover {
  background: #bfdbfe;
}

.btn-icon.delete {
  background: #fecaca;
  color: #991b1b;
}

.btn-icon.delete:hover {
  background: #fca5a5;
}

/* Checkbox Styles */
.checkbox-container {
  position: relative;
  cursor: pointer;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: relative;
  height: 20px;
  width: 20px;
  background-color: #eee;
  border-radius: 4px;
  border: 2px solid #ddd;
  transition: all 0.2s;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: #f0f0f0;
}

.checkbox-container input:checked ~ .checkmark {
  background-color: var(--rosie-primary);
  border-color: var(--rosie-primary);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
}

/* Loading and Empty States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--rosie-gray);
}

.loading-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

/* Modal Styles */
.modal-overlay {
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

.modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: var(--rosie-primary);
  font-size: 1.3rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: var(--rosie-gray);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f0f0f0;
  color: var(--rosie-primary);
}

.modal-body {
  padding: 2rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

/* Resource Type Selection */
.resource-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.resource-type-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.resource-type-option:hover {
  border-color: var(--rosie-primary);
  background: var(--rosie-bg);
}

.resource-type-option.active {
  border-color: var(--rosie-primary);
  background: var(--rosie-primary);
  color: white;
}

.resource-type-option i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.resource-type-option span {
  font-weight: 600;
  font-size: 0.9rem;
}

/* Form Styles */
.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--rosie-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--rosie-primary);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-options {
  display: flex;
  gap: 2rem;
  margin: 1.5rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--rosie-primary);
}

/* File Upload Styles */
.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1.5rem;
  transition: all 0.2s;
}

.file-upload-area:hover {
  border-color: var(--rosie-primary);
  background: #fafafa;
}

.upload-placeholder {
  cursor: pointer;
}

.upload-placeholder i {
  font-size: 3rem;
  color: var(--rosie-gray);
  margin-bottom: 1rem;
}

.upload-placeholder p {
  margin: 0 0 0.5rem 0;
  color: var(--rosie-primary);
  font-weight: 600;
}

.upload-placeholder small {
  color: var(--rosie-gray);
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--rosie-bg);
  border-radius: 8px;
}

.file-preview i {
  font-size: 1.5rem;
  color: var(--rosie-primary);
}

.file-preview span {
  font-weight: 600;
  color: var(--rosie-primary);
}

.remove-file {
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
}

.remove-file:hover {
  background: #b91c1c;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .table-header,
  .resource-row {
    grid-template-columns: 50px 1fr 120px 100px 80px 100px;
  }
}

@media (max-width: 768px) {
  .resources-admin {
    padding: 1rem;
  }

  .header-section {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
  }

  .filters select {
    min-width: 100%;
  }

  .table-header {
    display: none;
  }

  .resource-row {
    display: block;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }

  .resource-info {
    margin-bottom: 1rem;
  }

  .resource-actions {
    justify-content: center;
    margin-top: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-options {
    flex-direction: column;
    gap: 1rem;
  }

  .modal {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }

  .modal-body {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }

  .bulk-actions {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style> 