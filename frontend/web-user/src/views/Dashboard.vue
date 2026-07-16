<template>
  <div class="dashboard-page">
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="header-brand">
            <h1 class="brand-title">🛰️ Land Scanner</h1>
          </div>
          <nav class="header-nav">
            <router-link to="/" class="nav-link active">Dashboard</router-link>
            <router-link to="/analyze" class="nav-link">Analyze</router-link>
            <router-link to="/analyses" class="nav-link">Results</router-link>
            <router-link to="/zones" class="nav-link">My Zones</router-link>
            <router-link to="/requests" class="nav-link">Requests</router-link>
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
        <!-- Welcome Section -->
        <div class="welcome-section">
          <h2 class="page-title">Welcome back! 👋</h2>
          <p class="page-subtitle">{{ authStore.userEmail }}</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-3 mb-lg">
          <div class="stat-card">
            <div class="stat-icon">📍</div>
            <div class="stat-value">{{ zonesStore.zones.length }}</div>
            <div class="stat-label">Total Zones</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🖼️</div>
            <div class="stat-value">{{ totalImages }}</div>
            <div class="stat-label">Satellite Images</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ authStore.userTier?.tier_name || 'Free' }}</div>
            <div class="stat-label">Current Tier</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="section mb-lg">
          <h3 class="section-title">Quick Actions</h3>
          <div class="grid grid-2">
            <router-link to="/zones" class="action-card">
              <div class="action-icon">📍</div>
              <div>
                <div class="action-title">View My Zones</div>
                <div class="action-desc">Browse all assigned zones</div>
              </div>
            </router-link>
            
            <router-link to="/request" class="action-card">
              <div class="action-icon">➕</div>
              <div>
                <div class="action-title">Request New Zone</div>
                <div class="action-desc">Add a new monitoring area</div>
              </div>
            </router-link>

            <router-link to="/analyze" class="action-card">
              <div class="action-icon">🛰️</div>
              <div>
                <div class="action-title">Run Analysis</div>
                <div class="action-desc">Optical, weather, hydrology & more</div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Recent Zones -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">Recent Zones</h3>
            <router-link to="/zones" class="btn btn-secondary btn-sm">
              View All
            </router-link>
          </div>

          <!-- Loading State -->
          <div v-if="zonesStore.loading" class="loading-container">
            <div class="loading loading-lg"></div>
            <p class="text-muted mt-md">Loading zones...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="zonesStore.zones.length === 0" class="empty-state">
            <div class="empty-icon">📍</div>
            <div class="empty-title">No zones yet</div>
            <p class="empty-text">Request your first zone to start monitoring</p>
            <router-link to="/request" class="btn btn-primary mt-md">
              Request Zone
            </router-link>
          </div>

          <!-- Zones Grid -->
          <div v-else class="grid grid-3">
            <div
              v-for="zone in recentZones"
              :key="zone.zone_id"
              class="zone-card"
              @click="$router.push(`/zones/${zone.zone_id}`)"
            >
              <div class="zone-header">
                <h4 class="zone-name">{{ zone.zone_name }}</h4>
                <span class="badge badge-primary">{{ zone.quality.toUpperCase() }}</span>
              </div>
              <div class="zone-info">
                <div class="zone-info-item">
                  <span class="zone-info-label">📍 Coordinates:</span>
                  <span class="zone-info-value">
                    {{ zone.coordinates.latitude.toFixed(4) }}, 
                    {{ zone.coordinates.longitude.toFixed(4) }}
                  </span>
                </div>
                <div class="zone-info-item">
                  <span class="zone-info-label">📏 Area:</span>
                  <span class="zone-info-value">
                    {{ zone.area_size_feet }}×{{ zone.area_size_feet }} ft
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useZonesStore } from '@/stores/zones'

const router = useRouter()
const authStore = useAuthStore()
const zonesStore = useZonesStore()

const totalImages = ref(0)

const recentZones = computed(() => {
  return zonesStore.zones.slice(0, 6)
})

onMounted(async () => {
  if (authStore.userId) {
    await zonesStore.loadUserZones(authStore.userId)
    // Calculate total images (simplified)
    totalImages.value = zonesStore.zones.length * 5 // Placeholder
  }
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.dashboard-page {
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

.welcome-section {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: var(--spacing-sm);
}

.page-subtitle {
  font-size: 16px;
  color: var(--gray-500);
}

/* Stat Cards */
.stat-card {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: var(--spacing-sm);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 14px;
  color: var(--gray-500);
}

/* Sections */
.section {
  margin-bottom: var(--spacing-xl);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--gray-800);
}

/* Action Cards */
.action-card {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
  text-decoration: none;
  color: inherit;
}

.action-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--spacing-xs);
}

.action-desc {
  font-size: 14px;
  color: var(--gray-500);
}

/* Zone Cards */
.zone-card {
  background: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.zone-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.zone-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.zone-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
}

.zone-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.zone-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.zone-info-label {
  font-size: 12px;
  color: var(--gray-500);
}

.zone-info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
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
  
  .page-title {
    font-size: 24px;
  }
  
  .grid-3 {
    grid-template-columns: 1fr;
  }
  
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
