<template>
  <Teleport to="body">
    <Transition name="toast" appear>
      <div 
        v-if="show" 
        :class="[
          'toast',
          `toast-${type}`,
          { 'toast-dismissible': dismissible }
        ]"
        @click="handleClick"
      >
        <div class="toast-icon">
          <i :class="iconClass"></i>
        </div>
        
        <div class="toast-content">
          <div v-if="title" class="toast-title">{{ title }}</div>
          <div class="toast-message">{{ message }}</div>
        </div>
        
        <button 
          v-if="dismissible" 
          @click.stop="$emit('close')" 
          class="toast-close"
          aria-label="Close notification"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

interface Props {
  show: boolean
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 5000,
  dismissible: true,
  persistent: false
})

const emit = defineEmits<{
  close: []
}>()

const iconClass = computed(() => {
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  }
  return iconMap[props.type]
})

const handleClick = () => {
  if (props.dismissible) {
    emit('close')
  }
}

// Auto-dismiss after duration
onMounted(() => {
  if (!props.persistent && props.duration > 0) {
    setTimeout(() => {
      emit('close')
    }, props.duration)
  }
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  gap: 0.75rem;
  z-index: 10000;
  cursor: default;
}

.toast-dismissible {
  cursor: pointer;
}

.toast-success {
  border-left-color: #10b981;
}

.toast-error {
  border-left-color: #ef4444;
}

.toast-warning {
  border-left-color: #f59e0b;
}

.toast-info {
  border-left-color: #3b82f6;
}

.toast-icon {
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.toast-success .toast-icon {
  color: #10b981;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-warning .toast-icon {
  color: #f59e0b;
}

.toast-info .toast-icon {
  color: #3b82f6;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.toast-message {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s;
  margin-top: -0.125rem;
  margin-right: -0.25rem;
}

.toast-close:hover {
  color: #6b7280;
  background: #f3f4f6;
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .toast {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }
  
  .toast-enter-from,
  .toast-leave-to {
    transform: translateY(-100%) scale(0.95);
  }
}

/* Multiple toast positioning */
.toast:nth-child(2) {
  top: 100px;
}

.toast:nth-child(3) {
  top: 180px;
}

.toast:nth-child(4) {
  top: 260px;
}

@media (max-width: 768px) {
  .toast:nth-child(2) {
    top: 90px;
  }
  
  .toast:nth-child(3) {
    top: 170px;
  }
  
  .toast:nth-child(4) {
    top: 250px;
  }
}
</style> 