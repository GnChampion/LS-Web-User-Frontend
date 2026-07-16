<template>
  <div class="page">
    <AppHeader />

    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <div>
            <h2 class="page-title">My Zones</h2>
            <p class="page-subtitle">
              {{ zonesStore.zones.length }} zone{{ zonesStore.zones.length !== 1 ? 's' : '' }} assigned
            </p>
          </div>
          <router-link to="/request" class="btn btn-primary">
            ➕ Request New Zone
          </router-link>
        </div>

        <!-- Loading State -->
        <div v-if="zonesStore.loading" class="loading-container">
          <div class="loading loading-lg"></div>
          <p class="text-muted mt-md">Loading your zones...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="zonesStore.zones.length === 0" class="empty-state">
          <div class="empty-icon">📍</div>
          <div class="empty-title">No zones assigned yet</div>
          <p class="empty-text">
            Request your first zone to start monitoring your land with satellite imagery
          </p>
          <router-link to="/request" class="btn btn-primary btn-lg mt-lg">
            Request Your First Zone
          </router-link>
        </div>

        <!-- Map + Zones List -->
        <div v-else>
          <div class="card mb-lg">
            <div class="card-header">
              <h3 class="card-title">Zones Map</h3>
              <p class="card-subtitle">
                {{ zonesStore.zones.length }} zone{{ zonesStore.zones.length !== 1 ? 's' : '' }} shown
              </p>
            </div>
            <GoogleMap
              :api-key="googleMapsApiKey"
              :markers="zoneMarkers"
              :center="mapCenter"
              :zoom="mapZoom"
              height="420px"
              @marker-click="handleMarkerClick"
            />
          </div>

          <div class="zones-list">
            <div
              v-for="zone in zonesStore.zones"
              :key="zone.zone_id"
              class="zone-card-large"
              @click="$router.push(`/zones/${zone.zone_id}`)"
            >
              <div class="zone-card-header">
                <div class="zone-main-info">
                  <h3 class="zone-title">{{ zone.zone_name }}</h3>
                  <span class="badge badge-primary">{{ (zone.quality ?? 'N/A').toUpperCase() }}</span>
                </div>
                <div class="zone-id">ID: {{ zone.zone_id }}</div>
              </div>

              <div class="zone-card-body">
                <div class="zone-details">
                  <div class="zone-detail-item">
                    <div class="detail-icon">📍</div>
                    <div class="detail-content">
                      <div class="detail-label">Coordinates</div>
                      <div class="detail-value">
                        {{ zone.coordinates?.latitude?.toFixed(6) ?? 'N/A' }},
                        {{ zone.coordinates?.longitude?.toFixed(6) ?? 'N/A' }}
                      </div>
                    </div>
                  </div>

                  <div class="zone-detail-item">
                    <div class="detail-icon">📏</div>
                    <div class="detail-content">
                      <div class="detail-label">Area</div>
                      <div class="detail-value">
                        {{ zone.area_size_feet }} × {{ zone.area_size_feet }} feet
                      </div>
                    </div>
                  </div>

                  <div class="zone-detail-item">
                    <div class="detail-icon">🎯</div>
                    <div class="detail-content">
                      <div class="detail-label">Altitude</div>
                      <div class="detail-value">{{ zone.coordinates?.altitude ?? 'N/A' }} meters</div>
                    </div>
                  </div>

                  <div class="zone-detail-item" v-if="zone.created_at">
                    <div class="detail-icon">📅</div>
                    <div class="detail-content">
                      <div class="detail-label">Created</div>
                      <div class="detail-value">{{ formatDate(zone.created_at) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="zone-card-footer">
                <span class="zone-action">View Details →</span>
              </div>
            </div>
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
import GoogleMap from '@/components/GoogleMap.vue'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const zonesStore = useZonesStore()

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const zoneMarkers = computed(() =>
  zonesStore.zones
    .filter((zone) => zone.coordinates?.latitude != null && zone.coordinates?.longitude != null)
    .map((zone) => ({
      lat: zone.coordinates.latitude,
      lng: zone.coordinates.longitude,
      label: zone.zone_name,
      zoneId: zone.zone_id,
      title: zone.zone_name
    }))
)

const mapCenter = computed(() => {
  const withCoords = zonesStore.zones.filter((z) => z.coordinates?.latitude != null && z.coordinates?.longitude != null)
  if (withCoords.length > 0) {
    const lat = withCoords.reduce((sum, z) => sum + z.coordinates.latitude, 0) / withCoords.length
    const lng = withCoords.reduce((sum, z) => sum + z.coordinates.longitude, 0) / withCoords.length
    return { lat, lng }
  }
  return { lat: 11.0168, lng: 76.9558 }
})

const mapZoom = computed(() => {
  if (zonesStore.zones.length <= 1) return 14
  if (zonesStore.zones.length <= 5) return 11
  return 9
})

const handleMarkerClick = (marker: { zoneId?: string }) => {
  if (marker.zoneId) router.push(`/zones/${marker.zoneId}`)
}

onMounted(async () => {
  if (authStore.userId) {
    await zonesStore.loadUserZones(authStore.userId)
  }
})

const formatDate = (date: any) => {
  if (!date) return 'N/A'
  if (date.toDate) return date.toDate().toLocaleDateString()
  if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString()
  return new Date(date).toLocaleDateString()
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--gray-50);
}

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

.zones-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.zone-card-large {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.zone-card-large:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.zone-card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--gray-200);
}

.zone-main-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.zone-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
}

.zone-id {
  font-size: 12px;
  color: var(--gray-500);
  font-family: monospace;
}

.zone-card-body {
  padding: var(--spacing-lg);
}

.zone-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.zone-detail-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.detail-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.detail-content {
  flex: 1;
}

.detail-label {
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 2px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
}

.zone-card-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--gray-50);
  border-top: 1px solid var(--gray-200);
}

.zone-action {
  font-size: 14px;
  color: var(--primary);
  font-weight: 500;
}

.loading-container {
  text-align: center;
  padding: var(--spacing-2xl);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .page-title {
    font-size: 24px;
  }

  .zone-details {
    grid-template-columns: 1fr;
  }
}
</style>
