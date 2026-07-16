<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <!-- Logo/Header -->
        <div class="auth-header">
          <h1 class="auth-title">🛰️ Land Scanner</h1>
          <p class="auth-subtitle">Create your account to get started</p>
        </div>

        <!-- Error Alert -->
        <div v-if="authStore.error" class="alert alert-error">
          {{ authStore.error }}
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>

        <!-- Register Form -->
        <form @submit.prevent="handleRegister">
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
              placeholder="At least 6 characters"
              required
              minlength="6"
              :disabled="authStore.loading"
            />
            <p class="form-error" v-if="password && password.length < 6">
              Password must be at least 6 characters
            </p>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="form-input"
              placeholder="Re-enter password"
              required
              :disabled="authStore.loading"
            />
            <p class="form-error" v-if="confirmPassword && password !== confirmPassword">
              Passwords do not match
            </p>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            :disabled="authStore.loading || password !== confirmPassword || password.length < 6"
          >
            <span v-if="authStore.loading" class="loading"></span>
            <span v-else>Create Account</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="auth-footer">
          <p class="text-sm text-muted">
            Already have an account?
            <router-link to="/login">Sign in</router-link>
          </p>
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
const confirmPassword = ref('')
const successMessage = ref('')

const handleRegister = async () => {
  authStore.clearError()
  successMessage.value = ''
  
  if (password.value !== confirmPassword.value) {
    authStore.error = 'Passwords do not match'
    return
  }
  
  if (password.value.length < 6) {
    authStore.error = 'Password must be at least 6 characters'
    return
  }
  
  const success = await authStore.signUp(email.value, password.value)
  if (success) {
    successMessage.value = 'Account created successfully! Redirecting...'
    setTimeout(() => {
      router.push('/')
    }, 1500)
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

@media (max-width: 480px) {
  .auth-card {
    padding: var(--spacing-lg);
  }
  
  .auth-title {
    font-size: 24px;
  }
}
</style>
