<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Create New Case</h3>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="title">Case Title</label>
          <input 
            id="title"
            v-model="form.title" 
            type="text" 
            required 
            placeholder="Enter case title"
          />
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description"
            v-model="form.description" 
            rows="4" 
            placeholder="Describe the case details"
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="type">Case Type</label>
            <select id="type" v-model="form.type" required>
              <option value="">Select type</option>
              <option value="abortion_support">Abortion Support</option>
              <option value="legal_aid">Legal Aid</option>
              <option value="financial_assistance">Financial Assistance</option>
              <option value="transportation">Transportation</option>
              <option value="emotional_support">Emotional Support</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="urgency">Urgency Level</label>
            <select id="urgency" v-model="form.urgency" required>
              <option value="">Select urgency</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            {{ loading ? 'Creating...' : 'Create Case' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  show: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  created: [caseData: any]
}>()

const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  type: '',
  urgency: '',
})

const handleSubmit = async () => {
  loading.value = true
  
  try {
    // TODO: Connect to actual case creation logic
    console.log('Creating case:', form.value)
    emit('created', form.value)
    
    // Reset form
    form.value = {
      title: '',
      description: '',
      type: '',
      urgency: '',
    }
  } catch (error) {
    console.error('Error creating case:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #B91C1C;
  box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.1);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background: #e5e5e5;
}

.btn-primary {
  background: #B91C1C;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #991B1B;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 