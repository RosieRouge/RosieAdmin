<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="rosie-logo">
            <h1 class="rosie-title">Rosie App</h1>
            <div class="rosie-subtitle">Reproductive Health Support</div>
          </div>
          <h2 class="login-title">Admin Panel</h2>
          <p class="login-subtitle">Sign in to access Rosie App admin dashboard</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Admin Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              :disabled="loading"
              placeholder="admin@example.com"
              class="form-input"
              :class="{ error: errorMessage }"
            >
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              :disabled="loading"
              placeholder="Enter your password"
              class="form-input"
              :class="{ error: errorMessage }"
            >
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
            :disabled="loading || !email || !password"
            class="login-button"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-right-to-bracket"></i>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>

          <div class="forgot-password-link">
            <button
              type="button"
              @click="showForgotPasswordModal = true"
              class="link-button"
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotPasswordModal" class="modal-overlay" @click="closeForgotPasswordModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Reset Your Password</h3>
          <button @click="closeForgotPasswordModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <p class="reset-description">
            Enter your admin email address and we'll send you a link to reset your password.
          </p>

          <form @submit.prevent="handleForgotPassword" class="reset-form">
            <div class="form-group">
              <label for="reset-email">Admin Email</label>
              <input
                id="reset-email"
                v-model="resetEmail"
                type="email"
                required
                :disabled="resetLoading"
                placeholder="admin@example.com"
                class="form-input"
                :class="{ error: resetErrorMessage }"
              >
            </div>

            <div v-if="resetErrorMessage" class="error-message">
              <i class="fas fa-exclamation-triangle"></i>
              {{ resetErrorMessage }}
            </div>

            <div v-if="resetSuccessMessage" class="success-message">
              <i class="fas fa-check-circle"></i>
              {{ resetSuccessMessage }}
            </div>

            <div class="modal-actions">
              <button
                type="button"
                @click="closeForgotPasswordModal"
                class="btn-secondary"
                :disabled="resetLoading"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="resetLoading || !resetEmail"
                class="btn-primary"
              >
                <i v-if="resetLoading" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-paper-plane"></i>
                {{ resetLoading ? 'Sending...' : 'Send Reset Link' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Forgot password modal state
const showForgotPasswordModal = ref(false)
const resetEmail = ref('')
const resetLoading = ref(false)
const resetErrorMessage = ref('')
const resetSuccessMessage = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) return

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await authStore.signIn(email.value, password.value)

    if (result.error) {
      errorMessage.value = result.error.message || 'Login failed. Please check your credentials.'
      return
    }

    // Check if user is authenticated
    if (!authStore.isAuthenticated) {
      errorMessage.value = 'Authentication failed. Please try again.'
      return
    }

    // Check if user has admin privileges
    if (!authStore.isAdmin) {
      errorMessage.value = 'Access denied: Only administrators and super administrators can access this panel.'
      return
    }

    // Redirect to dashboard on successful login
    router.push('/dashboard')
  } catch (error: any) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = async () => {
  if (!resetEmail.value) return

  resetLoading.value = true
  resetErrorMessage.value = ''
  resetSuccessMessage.value = ''

  try {
    const result = await authStore.forgotPassword(resetEmail.value)

    if (result.error) {
      resetErrorMessage.value = result.error.message || 'Failed to send reset email. Please try again.'
      return
    }

    resetSuccessMessage.value = 'Password reset link has been sent to your email address. Please check your inbox and follow the instructions.'
    
    // Clear the form
    resetEmail.value = ''
    
    // Auto-close modal after 3 seconds
    setTimeout(() => {
      closeForgotPasswordModal()
    }, 3000)

  } catch (error: any) {
    console.error('Forgot password error:', error)
    resetErrorMessage.value = error.message || 'An unexpected error occurred'
  } finally {
    resetLoading.value = false
  }
}

const closeForgotPasswordModal = () => {
  showForgotPasswordModal.value = false
  resetEmail.value = ''
  resetErrorMessage.value = ''
  resetSuccessMessage.value = ''
  resetLoading.value = false
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

.login-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--rosie-primary) 0%, var(--rosie-primary-dark) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-xl);
  padding: 2.5rem 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid var(--rosie-secondary);
}

.login-header {
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

.login-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.login-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
}

.login-form {
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

.forgot-password-link {
  text-align: center;
  margin-top: 1rem;
}

.link-button {
  background: none;
  border: none;
  color: var(--rosie-primary);
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.link-button:hover {
  color: var(--rosie-primary-dark);
}

.login-button {
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

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(185, 28, 28, 0.3);
  background: linear-gradient(135deg, var(--rosie-primary-dark) 0%, #7f1d1d 100%);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-xl);
  padding: 2.5rem 2rem;
  width: 90%;
  max-width: 450px;
  position: relative;
  backdrop-filter: blur(10px);
  border: 1px solid var(--rosie-secondary);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--rosie-secondary);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--rosie-primary);
  font-family: 'Georgia', serif;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: var(--rosie-danger);
}

.modal-body {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--rosie-secondary);
}

.reset-description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.btn-secondary {
  flex: 1;
  padding: 0.875rem 1rem;
  background: var(--border-light);
  color: var(--text-primary);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-medium);
  color: var(--rosie-primary);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  flex: 1;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, var(--rosie-primary) 0%, var(--rosie-primary-dark) 100%);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--rosie-primary-dark) 0%, #7f1d1d 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(185, 28, 28, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .login-view {
    padding: 0.5rem;
  }
  
  .login-card {
    padding: 2rem 1.5rem;
  }
  
  .rosie-title {
    font-size: 2rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: #1a1a1a;
    color: #ffffff;
  }
  
  .login-title {
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

  .modal-content {
    background: #2d2d2d;
    border: 1px solid #404040;
  }

  .modal-header {
    border-bottom-color: #404040;
  }

  .modal-header h3 {
    color: #ffffff;
  }

  .close-btn {
    color: #888888;
  }

  .close-btn:hover {
    color: #ffffff;
  }

  .reset-description {
    color: #bbbbbb;
  }

  .reset-form .form-group label {
    color: #ffffff;
  }

  .reset-form .form-input {
    background: #333333;
    border-color: #404040;
    color: #ffffff;
  }

  .reset-form .form-input:focus {
    background: #333333;
  }

  .reset-form .error-message {
    background: #333333;
    border: 1px solid #404040;
  }

  .reset-form .success-message {
    background: #333333;
    border: 1px solid #404040;
  }

  .modal-actions .btn-secondary {
    background: #333333;
    border-color: #404040;
    color: #ffffff;
  }

  .modal-actions .btn-secondary:hover:not(:disabled) {
    background: #404040;
    color: #ffffff;
  }

  .modal-actions .btn-primary {
    background: linear-gradient(135deg, var(--rosie-primary) 0%, var(--rosie-primary-dark) 100%);
    color: #ffffff;
  }

  .modal-actions .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--rosie-primary-dark) 0%, #7f1d1d 100%);
  }
}
</style> 