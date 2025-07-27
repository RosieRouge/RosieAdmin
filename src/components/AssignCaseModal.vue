<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>
          <i class="fas fa-user-plus"></i>
          Assign Case
        </h2>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- Case Information -->
        <div v-if="selectedCase" class="case-info">
          <h3>Case Details</h3>
          <div class="case-summary">
            <div class="case-header">
              <div class="case-title">{{ selectedCase.title }}</div>
              <div class="case-badges">
                <span class="urgency-badge" :class="`urgency-${selectedCase.urgency}`">
                  {{ selectedCase.urgency.toUpperCase() }}
                </span>
                <span class="type-badge">{{ formatCaseType(selectedCase.type) }}</span>
              </div>
            </div>
            <div class="case-description">{{ selectedCase.description }}</div>
            <div class="case-meta">
              <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>Client: Unknown</span>
              </div>
              <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>Created: {{ formatDate(selectedCase.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Assignment Form -->
        <form @submit.prevent="handleSubmit" class="assignment-form">
          <!-- Available Doulas -->
          <div class="form-section">
            <h3>
              <i class="fas fa-users"></i>
              Select Doula/Counselor
            </h3>
            
            <div v-if="loadingDoulas" class="loading-doulas">
              <i class="fas fa-spinner fa-spin"></i>
              Loading available support staff...
            </div>

            <div v-else-if="availableDoulas.length === 0" class="no-doulas">
              <i class="fas fa-exclamation-triangle"></i>
              <p>No available doulas or counselors found.</p>
              <button type="button" @click="loadDoulas" class="refresh-btn">
                <i class="fas fa-refresh"></i>
                Refresh List
              </button>
            </div>

            <div v-else class="doulas-list">
              <label 
                v-for="doula in filteredDoulas" 
                :key="doula.id"
                class="doula-option"
                :class="{ selected: selectedDoulaId === doula.id }"
              >
                <input
                  v-model="selectedDoulaId"
                  type="radio"
                  :value="doula.id"
                  :disabled="loading"
                  required
                >
                <div class="doula-card">
                  <div class="doula-avatar">
                    <img v-if="doula.avatar" :src="doula.avatar" :alt="doula.name">
                    <div v-else class="default-avatar">{{ doula.name.charAt(0) }}</div>
                  </div>
                  <div class="doula-info">
                    <div class="doula-name">{{ doula.name }}</div>
                    <div class="doula-role">{{ formatRole(doula.role) }}</div>
                    <div class="doula-contact">
                      <i class="fas fa-envelope"></i>
                      {{ doula.email }}
                    </div>
                    <div v-if="doula.phone" class="doula-contact">
                      <i class="fas fa-phone"></i>
                      {{ doula.phone }}
                    </div>
                  </div>
                  <div class="doula-status">
                    <div class="status-indicator available">
                      <i class="fas fa-circle"></i>
                      Available
                    </div>
                    <div class="workload">
                      <small>Current cases: 3/8</small>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Filter Options -->
          <div class="filter-section">
            <h4>Filter by Specialization</h4>
            <div class="filter-buttons">
              <button 
                type="button"
                @click="specializationFilter = ''"
                :class="{ active: specializationFilter === '' }"
                class="filter-btn"
              >
                All
              </button>
              <button 
                type="button"
                @click="specializationFilter = 'doula'"
                :class="{ active: specializationFilter === 'doula' }"
                class="filter-btn"
              >
                Doulas
              </button>
              <button 
                type="button"
                @click="specializationFilter = 'counselor'"
                :class="{ active: specializationFilter === 'counselor' }"
                class="filter-btn"
              >
                Counselors
              </button>
            </div>
          </div>

          <!-- Assignment Reason -->
          <div class="form-group">
            <label for="assignment-reason">
              <i class="fas fa-comment"></i>
              Assignment Notes (Optional)
            </label>
            <textarea
              id="assignment-reason"
              v-model="assignmentReason"
              placeholder="Add any notes about why this doula/counselor is being assigned to this case..."
              rows="3"
              :disabled="loading"
            ></textarea>
          </div>

          <!-- Priority Assignment -->
          <div v-if="selectedCase && (selectedCase.urgency === 'critical' || selectedCase.urgency === 'high')" class="priority-notice">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <strong>Priority Assignment</strong>
              <p>This is a {{ selectedCase.urgency }} priority case. The assigned doula will be notified immediately.</p>
            </div>
          </div>

          <!-- Error Display -->
          <div v-if="error" class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            {{ error }}
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" @click="$emit('close')" class="cancel-btn" :disabled="loading">
              Cancel
            </button>
            <button type="submit" class="assign-btn" :disabled="loading || !selectedDoulaId">
              <i v-if="loading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-user-check"></i>
              {{ loading ? 'Assigning...' : 'Assign Case' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCasesStore } from '@/stores/cases'
import { storeToRefs } from 'pinia'
import type { SupportCase, CaseType, UserRole } from '@/types'

interface Props {
  show: boolean
  selectedCase: SupportCase | null
}

interface Emits {
  (e: 'close'): void
  (e: 'assigned'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const casesStore = useCasesStore()

// Mock available doulas since the store doesn't have this property yet
const availableDoulas = ref<any[]>([])

const loading = ref(false)
const loadingDoulas = ref(false)
const error = ref('')
const selectedDoulaId = ref('')
const assignmentReason = ref('')
const specializationFilter = ref('')

const filteredDoulas = computed(() => {
  if (!specializationFilter.value) return availableDoulas.value
  
  return availableDoulas.value.filter(doula => 
    doula.role === specializationFilter.value
  )
})

const formatCaseType = (type: CaseType): string => {
  const typeMap: Record<CaseType, string> = {
    abortion_support: 'Abortion Support',
    emotional_support: 'Emotional Support',
    legal_aid: 'Legal Aid',
    financial_assistance: 'Financial Assistance',
    transportation: 'Transportation',
    other: 'Other'
  }
  return typeMap[type] || type
}

const formatRole = (role?: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    client: 'Client',
    counselor: 'Counselor',
    admin: 'Administrator',
    super_admin: 'Super Administrator'
  }
  return roleMap[role || 'client'] || 'Support Staff'
}

const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadDoulas = async () => {
  loadingDoulas.value = true
  try {
    await casesStore.loadAvailableDoulas()
  } catch (error) {
    console.error('Error loading doulas:', error)
  } finally {
    loadingDoulas.value = false
  }
}

const handleOverlayClick = () => {
  if (!loading.value) {
    emit('close')
  }
}

const handleSubmit = async () => {
  if (!selectedDoulaId.value || !authStore.user?.id || !props.selectedCase) return

  loading.value = true
  error.value = ''

  try {
    // Mock assignment - replace with actual implementation
    console.log('Assigning case:', {
      caseId: props.selectedCase.id,
      doulaId: selectedDoulaId.value,
      adminId: authStore.user.id,
      reason: assignmentReason.value.trim() || undefined
    })

    emit('assigned')

  } catch (err: any) {
    console.error('Error assigning case:', err)
    error.value = err.message || 'Failed to assign case. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDoulas()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-header h2 i {
  color: #007AFF;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #333;
}

.modal-body {
  padding: 1rem 2rem 2rem 2rem;
}

.case-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.case-info h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.case-summary .case-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.case-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.case-badges {
  display: flex;
  gap: 0.5rem;
}

.urgency-badge, .type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.urgency-badge.urgency-critical {
  background: #ff3b30;
  color: white;
}

.urgency-badge.urgency-high {
  background: #ff9500;
  color: white;
}

.urgency-badge.urgency-medium {
  background: #ffcc00;
  color: #333;
}

.urgency-badge.urgency-low {
  background: #34c759;
  color: white;
}

.type-badge {
  background: #007AFF;
  color: white;
}

.case-description {
  color: #555;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.case-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.meta-item i {
  color: #007AFF;
  width: 16px;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  color: #333;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-section h3 i {
  color: #007AFF;
}

.loading-doulas, .no-doulas {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.loading-doulas i {
  font-size: 1.5rem;
  color: #007AFF;
  margin-bottom: 1rem;
}

.no-doulas i {
  font-size: 2rem;
  color: #ff9500;
  margin-bottom: 1rem;
}

.refresh-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem auto 0 auto;
}

.doulas-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.doula-option {
  display: block;
  cursor: pointer;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.2s;
}

.doula-option:hover {
  border-color: #007AFF;
}

.doula-option.selected {
  border-color: #007AFF;
  background: #f8f9ff;
}

.doula-option input[type="radio"] {
  display: none;
}

.doula-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.doula-avatar img,
.default-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #007AFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.doula-info {
  flex: 1;
}

.doula-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.doula-role {
  color: #007AFF;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.doula-contact {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.doula-contact i {
  width: 12px;
  color: #007AFF;
}

.doula-status {
  text-align: right;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.status-indicator.available {
  color: #34c759;
}

.status-indicator i {
  font-size: 0.6rem;
}

.workload {
  color: #666;
  font-size: 0.8rem;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 0.95rem;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #e9ecef;
}

.filter-btn.active {
  background: #007AFF;
  border-color: #007AFF;
  color: white;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group label i {
  color: #007AFF;
  width: 16px;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
  resize: vertical;
  line-height: 1.5;
}

.form-group textarea:focus {
  outline: none;
  border-color: #007AFF;
}

.priority-notice {
  background: #fff3e0;
  border: 2px solid #ff9500;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.priority-notice i {
  color: #ff9500;
  font-size: 1.25rem;
  margin-top: 0.25rem;
}

.priority-notice strong {
  display: block;
  color: #333;
  margin-bottom: 0.25rem;
}

.priority-notice p {
  color: #666;
  margin: 0;
}

.error-message {
  background: #ffebee;
  border: 1px solid #ff3b30;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e9ecef;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn:hover:not(:disabled) {
  background: #e9ecef;
  color: #333;
}

.assign-btn {
  background: #007AFF;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.assign-btn:hover:not(:disabled) {
  background: #0056CC;
}

.assign-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .modal-content {
    margin: 0;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header,
  .modal-body {
    padding: 1.5rem;
  }

  .case-summary .case-header {
    flex-direction: column;
    gap: 1rem;
  }

  .case-meta {
    flex-direction: column;
    gap: 0.75rem;
  }

  .doula-card {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .doula-status {
    text-align: center;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style> 