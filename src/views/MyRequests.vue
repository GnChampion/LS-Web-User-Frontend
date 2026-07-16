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
            <router-link to="/requests" class="nav-link active">Requests</router-link>
            <router-link to="/profile" class="nav-link">Profile</router-link>
            <button @click="handleLogout" class="btn btn-secondary btn-sm">
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container">
        <!-- Page Header -->
        <div class="page-header">
          <div>
            <h2 class="page-title">My Zone Requests</h2>
            <p class="page-subtitle">
              Track the status of your zone requests
            </p>
          </div>
          <router-link to="/request" class="btn btn-primary">
            ➕ New Request
          </router-link>
        </div>

        <!-- Loading State -->
        <div v-if="zonesStore.loading" class="loading-container">
          <div class="loading loading-lg"></div>
          <p class="text-muted mt-md">Loading requests...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="zonesStore.userRequests.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">No zone requests yet</div>
          <p class="empty-text">
            Submit your first zone request to start monitoring your land
          </p>
          <router-link to="/request" class="btn btn-primary btn-lg mt-lg">
            Submit First Request
          </router-link>
        </div>

        <!-- Requests List -->
        <div v-else class="requests-list">
          <div
            v-for="request in zonesStore.userRequests"
            :key="request.request_id"
            class="request-card"
          >
            <div class="request-header">
              <div class="request-status">
                <span
                  class="badge"
                  :class="{
                    'badge-warning': request.status === 'pending',
                    'badge-success': request.status === 'approved',
                    'badge-danger': request.status === 'rejected'
                  }"
                >
                  {{ request.status.toUpperCase() }}
                </span>
                <span class="request-date">{{ formatDate(request.created_at) }}</span>
              </div>
            </div>

            <div class="request-body">
              <div class="request-details">
                <div class="detail-row">
                  <span class="detail-label">📍 Coordinates:</span>
                  <span class="detail-value">
                    {{ request.coordinates.latitude.toFixed(6) }}, 
                    {{ request.coordinates.longitude.toFixed(6) }}
                  </span>
                </div>

                <div class="detail-row" v-if="request.zone_area">
                  <span class="detail-label">📏 Area:</span>
                  <span class="detail-value">
                    {{ request.zone_area.size_feet }} ft²
                  </span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">⭐ Quality:</span>
                  <span class="detail-value">{{ request.quality.toUpperCase() }}</span>
                </div>

                <div class="detail-row" v-if="request.notes">
                  <span class="detail-label">📝 Notes:</span>
                  <span class="detail-value">{{ request.notes }}</span>
                </div>
              </div>

              <!-- Admin Notes -->
              <div v-if="request.admin_notes" class="admin-notes">
                <div class="admin-notes-label">Admin Notes:</div>
                <div class="admin-notes-text">{{ request.admin_notes }}</div>
              </div>

              <!-- Approved Zone Link -->
              <div v-if="request.status === 'approved' && request.zone_id" class="request-action">
                <router-link :to="`/zones/${request.zone_id}`" class="btn btn-primary btn-sm">
                  View Zone →
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useZonesStore } from '@/stores/zones'

const router = useRouter()
const authStore = useAuthStore()
const zonesStore = useZonesStore()

onMounted(async () => {
  if (authStore.userId) {
    await zonesStore.loadUserRequests(authStore.userId)
  }
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: var(--spacing-xs);
}

.page-subtitle {
  font-size: 16px;
  color: var(--gray-500);
}

/* Requests List */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.request-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.request-header {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
}

.request-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.request-date {
  font-size: 14px;
  color: var(--gray-500);
}

.request-body {
  padding: var(--spacing-lg);
}

.request-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-row {
  display: flex;
  gap: var(--spacing-sm);
}

.detail-label {
  font-size: 14px;
  color: var(--gray-500);
  min-width: 140px;
}

.detail-value {
  font-size: 14px;
  color: var(--gray-800);
  font-weight: 500;
}

/* Admin Notes */
.admin-notes {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--gray-50);
  border-left: 3px solid var(--primary);
  border-radius: var(--radius-md);
}

.admin-notes-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.admin-notes-text {
  font-size: 14px;
  color: var(--gray-700);
  line-height: 1.5;
}

.request-action {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
}

/* Loading */
.loading-container {
  text-align: center;
  padding: var(--spacing-2xl);
}

/* Responsive */
@media (max-width: 768px) {
  .header-nav {
    display: none;
  }

  .page-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .page-title {
    font-size: 24px;
  }

  .detail-row {
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    min-width: auto;
  }
}
</style>
