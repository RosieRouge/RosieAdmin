<template>
  <div class="reset-password-view">
    <div class="reset-container">
      <div class="reset-card">
        <div class="reset-header">
          <div class="rosie-logo">
            <h1 class="rosie-title">Rosie App</h1>
            <div class="rosie-subtitle">Reproductive Health Support</div>
          </div>
          <h2 class="reset-title">Reset Your Password</h2>
          <p class="reset-subtitle">Enter your new password below</p>
        </div>

        <form @submit.prevent="handleResetPassword" class="reset-form">
          <div class="form-group">
            <label for="new-password">New Password</label>
            <input
              id="new-password"
              v-model="newPassword"
              type="password"
              required
              :disabled="loading"
              placeholder="Enter your new password"
              class="form-input"
              :class="{ error: errorMessage }"
              minlength="8"
            >
            <small class="password-hint">Password must be at least 8 characters long</small>
          </div>

          <div class="form-group">
            <label for="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              required
              :disabled="loading"
              placeholder="Confirm your new password"
              class="form-input"
              :class="{ error: errorMessage || passwordMismatch }"
            >
            <small v-if="passwordMismatch" class="error-hint">Passwords do not match</small>
          </div>

          <div v-if="errorMessage" class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            {{ errorMessage }}
          </div>

          <div v-if="successMessage" class="success-message">
            <i class="fas fa-check-circle"></i>
            {{ successMessage }}
          </div>

          <button
            type="submit"
            :disabled="loading || !newPassword || !confirmPassword || passwordMismatch || newPassword.length < 8"
            class="reset-button"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-key"></i>
            {{ loading ? 'Updating Password...' : 'Update Password' }}
          </button>
        </form>

        <div class="back-to-login">
          <RouterLink to="/login" class="link-button">
            <i class="fas fa-arrow-left"></i>
            Back to Login
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const passwordMismatch = computed(() => {
  return confirmPassword.value && newPassword.value !== confirmPassword.value
})

onMounted(() => {
  // Check if user has a valid session for password reset
  // Supabase handles the token validation automatically when user clicks email link
  if (!authStore.session) {
    errorMessage.value = 'Invalid or expired password reset link. Please request a new one.'
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
})

const handleResetPassword = async () => {
  if (!newPassword.value || !confirmPassword.value) return
  
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await authStore.resetPassword(newPassword.value)

    if (result.error) {
      errorMessage.value = result.error.message || 'Failed to update password. Please try again.'
      return
    }

    successMessage.value = 'Password updated successfully! Redirecting to login...'
    
    // Clear form
    newPassword.value = ''
    confirmPassword.value = ''
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (error: any) {
    console.error('Reset password error:', error)
    errorMessage.value = error.message || 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:root {
  --rosie-primary: #B91C1C;
  --rosie-primary-dark: #991B1B;
  --rosie-secondary: #FDE2E2;
  --rosie-danger: #DC2626;
  --rosie-success: #059669;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --border-light: #F9FAFB;
  --border-medium: #E5E7EB;
  --radius-lg: 8px;
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --transition-normal: all 0.2s ease;
}

.reset-password-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--rosie-primary) 0%, var(--rosie-primary-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.reset-container {
  width: 100%;
  max-width: 450px;
}

.reset-card {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-xl);
  padding: 2.5rem 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid var(--rosie-secondary);
}

.reset-header {
  text-align: center;
  margin-bottom: 2rem;
}

.rosie-logo {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--rosie-secondary);
}

.rosie-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--rosie-primary);
  margin: 0;
  font-family: 'Georgia', serif;
}

.rosie-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 0.25rem;
}

.reset-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.reset-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.form-input {
  padding: 0.875rem 1rem;
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-lg);
  font-size: 1rem;
  transition: var(--transition-normal);
  background: var(--border-light);
}

.form-input:focus {
  outline: none;
  border-color: var(--rosie-primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.1);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input.error {
  border-color: var(--rosie-danger);
  background: #fef2f2;
}

.password-hint {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.error-hint {
  color: var(--rosie-danger);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--rosie-danger);
  font-size: 0.9rem;
  background: #fef2f2;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid #fecaca;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--rosie-success);
  font-size: 0.9rem;
  background: #ecfdf5;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid #d1fae5;
}

.reset-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, var(--rosie-primary) 0%, var(--rosie-primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  margin-top: 0.5rem;
}

.reset-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(185, 28, 28, 0.3);
  background: linear-gradient(135deg, var(--rosie-primary-dark) 0%, #7f1d1d 100%);
}

.reset-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.back-to-login {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--rosie-secondary);
}

.link-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--rosie-primary);
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 0.2s ease;
  font-weight: 500;
}

.link-button:hover {
  color: var(--rosie-primary-dark);
  text-decoration: underline;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .reset-password-view {
    padding: 0.5rem;
  }
  
  .reset-card {
    padding: 2rem 1.5rem;
  }
  
  .rosie-title {
    font-size: 2rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .reset-card {
    background: #1a1a1a;
    color: #ffffff;
  }
  
  .reset-title {
    color: #ffffff;
  }
  
  .form-group label {
    color: #ffffff;
  }
  
  .form-input {
    background: #2d2d2d;
    border-color: #404040;
    color: #ffffff;
  }
  
  .form-input:focus {
    background: #333333;
  }
  
  .password-hint {
    color: #bbbbbb;
  }
  
  .error-hint {
    color: #ff6b6b;
  }
  
  .link-button {
    color: #ff6b6b;
  }
  
  .link-button:hover {
    color: #ff5252;
  }
}
</style> 