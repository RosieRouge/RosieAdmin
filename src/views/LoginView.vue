<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="rosie-logo">
            <h1 class="rosie-title">Rosie Rouge</h1>
            <div class="rosie-subtitle">Reproductive Health Support</div>
          </div>
          <h2 class="login-title">Admin Panel</h2>
          <p class="login-subtitle">Sign in to access Rosie Rouge admin dashboard</p>
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

          <button
            type="submit"
            :disabled="loading || !email || !password"
            class="login-button"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                          <i v-else class="fas fa-right-to-bracket"></i>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
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

const handleLogin = async () => {
  if (!email.value || !password.value) return

  loading.value = true
  errorMessage.value = ''

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
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  padding: 2.5rem 2rem;
  backdrop-filter: blur(10px);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.rosie-logo {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f3f4;
}

.rosie-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #dc6bac;
  margin: 0;
  font-family: 'Georgia', serif;
}

.rosie-subtitle {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-style: italic;
  margin-top: 0.25rem;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.login-subtitle {
  color: #7f8c8d;
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
  color: #2c3e50;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.875rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #fafafa;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input.error {
  border-color: #e74c3c;
  background: #fdf2f2;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e74c3c;
  font-size: 0.9rem;
  background: #fdf2f2;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #fadad7;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .login-view {
    padding: 0.5rem;
  }
  
  .login-card {
    padding: 2rem 1.5rem;
  }
  
  .login-title {
    font-size: 1.75rem;
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
}
</style> 