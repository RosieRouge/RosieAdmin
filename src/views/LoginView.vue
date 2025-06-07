<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1 class="login-title">Admin Panel</h1>
          <p class="login-subtitle">Sign in to access Community Connect admin dashboard</p>
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
            <i v-else class="fas fa-sign-in-alt"></i>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="dev-help">
          <details>
            <summary>Development Help</summary>
            <div class="dev-content">
              <p><strong>First time setup?</strong></p>
              <p>Create an admin user by running this SQL in your Supabase SQL Editor:</p>
              <pre><code>INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role)
VALUES (
  gen_random_uuid(), 
  'admin@admin.com', 
  crypt('AdminPass123!', gen_salt('bf')), 
  now(), 
  now(), 
  now(),
  'authenticated'
);

INSERT INTO public.users (id, name, email, role)
SELECT id, 'Super Admin User', email, 'super_admin' 
FROM auth.users 
WHERE email = 'admin@admin.com';</code></pre>
              <p><strong>Default credentials:</strong></p>
              <p>Email: admin@admin.com<br>Password: AdminPass123!</p>
            </div>
          </details>
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

const email = ref('admin@admin.com')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const { error } = await authStore.signIn(email.value, password.value)

    if (error) {
      errorMessage.value = error.message || 'Login failed. Please check your credentials.'
      return
    }

    // Redirect to dashboard on successful login
    router.push('/dashboard')
  } catch (error: any) {
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

.login-title {
  font-size: 2rem;
  font-weight: 700;
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

.dev-help {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

.dev-help summary {
  color: #7f8c8d;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 0;
  user-select: none;
}

.dev-help summary:hover {
  color: #667eea;
}

.dev-content {
  padding: 1rem 0;
  color: #6c757d;
  font-size: 0.85rem;
  line-height: 1.5;
}

.dev-content p {
  margin: 0 0 1rem 0;
}

.dev-content strong {
  color: #495057;
}

.dev-content pre {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border-left: 3px solid #667eea;
  overflow-x: auto;
  margin: 1rem 0;
  font-size: 0.8rem;
}

.dev-content code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.4;
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
  
  .dev-content pre {
    font-size: 0.75rem;
    padding: 0.75rem;
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
  
  .dev-content pre {
    background: #2d2d2d;
    color: #ffffff;
  }
}
</style> 