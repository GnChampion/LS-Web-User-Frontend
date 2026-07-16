<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <!-- Logo/Header -->
        <div class="auth-header">
          <h1 class="auth-title">🛰️ Land Scanner</h1>
          <p class="auth-subtitle">Monitor your land with satellite imagery</p>
        </div>

        <!-- Error Alert -->
        <div v-if="authStore.error" class="alert alert-error">
          {{ authStore.error }}
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-input"
              placeholder="your@email.com"
              required
              :disabled="authStore.loading"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              required
              :disabled="authStore.loading"
            />
          </div>

          <div class="form-group">
            <a href="#" @click.prevent="showForgotPassword = true" class="text-sm">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            :disabled="authStore.loading"
          >
            <span v-if="authStore.loading" class="loading"></span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <!-- Register Link -->
        <div class="auth-footer">
          <p class="text-sm text-muted">
            Don't have an account?
            <router-link to="/register">Create one</router-link>
          </p>
        </div>

        <!-- Forgot Password Modal -->
        <div v-if="showForgotPassword" class="modal-overlay" @click="showForgotPassword = false">
          <div class="modal-content" @click.stop>
            <h3 class="modal-title">Reset Password</h3>
            <p class="text-sm text-muted mb-md">
              Enter your email address and we'll send you a password reset link.
            </p>
            
            <div v-if="resetSuccess" class="alert alert-success">
              Password reset email sent! Check your inbox.
            </div>

            <form @submit.prevent="handlePasswordReset">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input
                  v-model="resetEmail"
                  type="email"
                  class="form-input"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div class="flex gap-md">
                <button
                  type="button"
                  class="btn btn-secondary flex-1"
                  @click="showForgotPassword = false"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary flex-1"
                  :disabled="authStore.loading"
                >
                  <span v-if="authStore.loading" class="loading"></span>
                  <span v-else>Send Reset Link</span>
                </button>
              </div>
            </form>
          </div>
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
const showForgotPassword = ref(false)
const resetEmail = ref('')
const resetSuccess = ref(false)

const handleLogin = async () => {
  authStore.clearError()
  const success = await authStore.signIn(email.value, password.value)
  if (success) {
    router.push('/')
  }
}

const handlePasswordReset = async () => {
  authStore.clearError()
  resetSuccess.value = false
  const success = await authStore.sendPasswordReset(resetEmail.value)
  if (success) {
    resetSuccess.value = true
    setTimeout(() => {
      showForgotPassword.value = false
      resetSuccess.value = false
      resetEmail.value = ''
    }, 3000)
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-lg);
}

.auth-container {
  width: 100%;
  max-width: 420px;
}

.auth-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-xl);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.auth-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: var(--spacing-sm);
}

.auth-subtitle {
  font-size: 14px;
  color: var(--gray-500);
}

.auth-footer {
  margin-top: var(--spacing-lg);
  text-align: center;
}

.flex-1 {
  flex: 1;
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
  padding: var(--spacing-lg);
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-xl);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--gray-800);
}

@media (max-width: 480px) {
  .auth-card {
    padding: var(--spacing-lg);
  }
  
  .auth-title {
    font-size: 24px;
  }
}
</style>
