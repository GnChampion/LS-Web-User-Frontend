import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { User } from 'firebase/auth'
import { login, register, logout, getCurrentUser, resetPassword, getAuthToken, requireAuth } from '@/services/firebase'
import { apiService } from '@/services/api'
import type { UserTier } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const userTier = ref<UserTier | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email || '')
  const userId = computed(() => user.value?.uid || '')

  async function checkAuth() {
    loading.value = true
    try {
      if (!requireAuth) {
        // Preview mode: no Firebase login required.
        user.value = { uid: 'preview', email: 'preview@local', displayName: 'Preview User' } as User
        userTier.value = {
          tier_id: 'free', tier_name: 'Free', tier_level: 'free',
          zones_limit: 1, images_per_month: 10, automation_enabled: false, priority: 'low'
        }
        return
      }
      const currentUser = await getCurrentUser()
      user.value = currentUser
      
      if (currentUser) {
        // Fetch user tier from backend
        userTier.value = await apiService.getUserTier(currentUser.uid)
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err).replace(/[\r\n]/g, ' ')
      console.error('Auth check error:', msg)
      error.value = msg
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const loggedInUser = await login(email, password)
      user.value = loggedInUser
      
      // Fetch user tier
      if (loggedInUser) {
        userTier.value = await apiService.getUserTier(loggedInUser.uid)
      }
      
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const newUser = await register(email, password)
      user.value = newUser

      // Persist the P2 user profile in Firestore via the backend so the admin
      // panel can read it. Admin listing now also falls back to Firebase Auth,
      // but the profile carries tier/display data.
      if (newUser) {
        try {
          await getAuthToken()
          await apiService.registerUser({
            email: newUser.email || email,
            display_name: newUser.displayName || '',
            tier_id: 'free'
          })
        } catch (e) {
          console.error('Profile sync failed (non-fatal):', e)
        }
      }
      
      // Initialize with free tier
      userTier.value = {
        tier_id: 'free',
        tier_name: 'Free',
        tier_level: 'free',
        zones_limit: 1,
        images_per_month: 10,
        automation_enabled: false,
        priority: 'low'
      }
      
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    loading.value = true
    try {
      await logout()
      user.value = null
      userTier.value = null
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function sendPasswordReset(email: string) {
    loading.value = true
    error.value = null
    try {
      await resetPassword(email)
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function setValidationError(msg: string) {
    error.value = msg
  }

  return {
    user,
    userTier,
    loading,
    error,
    isAuthenticated,
    userEmail,
    userId,
    checkAuth,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    clearError,
    setValidationError
  }
})
