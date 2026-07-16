<template>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="header-brand">
            <h1 class="brand-title">🛰️ Land Scanner</h1>
          </div>
          <nav class="header-nav">
            <router-link to="/" class="nav-link">Dashboard</router-link>
            <router-link to="/zones" class="nav-link">My Zones</router-link>
            <router-link to="/requests" class="nav-link">Requests</router-link>
            <router-link to="/profile" class="nav-link active">Profile</router-link>
            <button @click="handleLogout" class="btn btn-secondary btn-sm">
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container-sm">
        <h2 class="page-title mb-lg">Profile</h2>

        <!-- User Info Card -->
        <div class="card mb-lg">
          <div class="card-header">
            <h3 class="card-title">Account Information</h3>
          </div>

          <div class="profile-section">
            <div class="profile-item">
              <div class="profile-label">Email</div>
              <div class="profile-value">{{ authStore.userEmail }}</div>
            </div>

            <div class="profile-item">
              <div class="profile-label">User ID</div>
              <div class="profile-value profile-value-mono">{{ authStore.userId }}</div>
            </div>

            <div class="profile-item">
              <div class="profile-label">Account Created</div>
              <div class="profile-value">{{ accountCreated }}</div>
            </div>
          </div>
        </div>

        <!-- Subscription Tier Card -->
        <div class="card mb-lg">
          <div class="card-header">
            <h3 class="card-title">Subscription Tier</h3>
          </div>

          <div class="tier-section">
            <div class="tier-header">
              <div class="tier-badge">
                <span class="tier-icon">⭐</span>
                <span class="tier-name">{{ tierName }}</span>
              </div>
              <span
                class="badge"
                :class="{
                  'badge-gray': tierLevel === 'free',
                  'badge-primary': tierLevel === 'standard',
                  'badge-warning': tierLevel === 'pro',
                  'badge-success': tierLevel === 'enterprise'
                }"
              >
                {{ tierLevel.toUpperCase() }}
              </span>
            </div>

            <div class="tier-features">
              <div class="feature-item">
                <div class="feature-icon">📍</div>
                <div class="feature-content">
                  <div class="feature-label">Zones Limit</div>
                  <div class="feature-value">{{ zonesLimit }}</div>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">🖼️</div>
                <div class="feature-content">
                  <div class="feature-label">Images per Month</div>
                  <div class="feature-value">{{ imagesLimit }}</div>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">🤖</div>
                <div class="feature-content">
                  <div class="feature-label">Automation</div>
                  <div class="feature-value">
                    <span v-if="automationEnabled" class="text-success">✓ Enabled</span>
                    <span v-else class="text-muted">✗ Not Available</span>
                  </div>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">🚀</div>
                <div class="feature-content">
                  <div class="feature-label">Priority</div>
                  <div class="feature-value">{{ priority }}</div>
                </div>
              </div>
            </div>

            <div class="tier-footer">
              <p class="tier-note">
                <strong>Note:</strong> Contact admin to upgrade your subscription tier
              </p>
            </div>
          </div>
        </div>

        <!-- Stats Card -->
        <div class="card mb-lg">
          <div class="card-header">
            <h3 class="card-title">Usage Statistics</h3>
          </div>

          <div class="stats-section">
            <div class="stat-item">
              <div class="stat-value">{{ zonesStore.zones.length }}</div>
              <div class="stat-label">Total Zones</div>
            </div>

            <div class="stat-item">
              <div class="stat-value">{{ totalRequests }}</div>
              <div class="stat-label">Zone Requests</div>
            </div>

            <div class="stat-item">
              <div class="stat-value">{{ pendingRequests }}</div>
              <div class="stat-label">Pending Requests</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Account Actions</h3>
          </div>

          <div class="actions-section">
            <button @click="handleLogout" class="btn btn-danger btn-block">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useZonesStore } from '@/stores/zones'

const router = useRouter()
const authStore = useAuthStore()
const zonesStore = useZonesStore()

const tierName = computed(() => authStore.userTier?.tier_name || 'Free')
const tierLevel = computed(() => authStore.userTier?.tier_level || 'free')
const zonesLimit = computed(() => {
  const limit = authStore.userTier?.zones_limit
  return limit === -1 || !limit ? 'Unlimited' : limit
})
const imagesLimit = computed(() => {
  const limit = authStore.userTier?.images_per_month
  return limit === -1 || !limit ? 'Unlimited' : limit
})
const automationEnabled = computed(() => authStore.userTier?.automation_enabled || false)
const priority = computed(() => {
  const p = authStore.userTier?.priority || 'low'
  return p.charAt(0).toUpperCase() + p.slice(1)
})

const totalRequests = computed(() => zonesStore.userRequests.length)
const pendingRequests = computed(() => 
  zonesStore.userRequests.filter(r => r.status === 'pending').length
)

const accountCreated = computed(() => {
  if (authStore.user?.metadata?.creationTime) {
    return new Date(authStore.user.metadata.creationTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return 'N/A'
})

onMounted(async () => {
  if (authStore.userId) {
    await zonesStore.loadUserZones(authStore.userId)
    await zonesStore.loadUserRequests(authStore.userId)
  }
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--gray-50);
}

/* Header */
.header {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.brand-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.nav-link {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-600);
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}

.nav-link.active {
  background: var(--primary);
  color: white;
}

/* Main Content */
.main-content {
  padding: var(--spacing-xl) 0;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--gray-800);
}

/* Profile Section */
.profile-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.profile-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.profile-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-value {
  font-size: 16px;
  color: var(--gray-800);
}

.profile-value-mono {
  font-family: monospace;
  font-size: 14px;
  color: var(--gray-600);
}

/* Tier Section */
.tier-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.tier-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tier-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.tier-icon {
  font-size: 32px;
}

.tier-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-800);
}

.tier-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.feature-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.feature-icon {
  font-size: 24px;
}

.feature-content {
  flex: 1;
}

.feature-label {
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 4px;
}

.feature-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
}

.text-success {
  color: var(--success);
}

.tier-footer {
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
}

.tier-note {
  font-size: 14px;
  color: var(--gray-600);
  line-height: 1.5;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 14px;
  color: var(--gray-500);
}

/* Actions Section */
.actions-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Responsive */
@media (max-width: 768px) {
  .header-nav {
    display: none;
  }

  .page-title {
    font-size: 24px;
  }

  .tier-features {
    grid-template-columns: 1fr;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>
