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
        <!-- Back Button -->
        <button @click="$router.back()" class="btn btn-secondary mb-lg">
          ← Back to Zones
        </button>

        <!-- Loading State -->
        <div v-if="zonesStore.loading" class="loading-container">
          <div class="loading loading-lg"></div>
          <p class="text-muted mt-md">Loading zone details...</p>
        </div>

        <!-- Zone Details -->
        <div v-else-if="zonesStore.currentZone" class="zone-detail">
          <!-- Zone Info Card -->
          <div class="card mb-lg">
            <div class="card-header">
              <div>
                <h2 class="card-title">{{ zonesStore.currentZone.zone_name }}</h2>
                <p class="card-subtitle">{{ zonesStore.currentZone.zone_id }}</p>
              </div>
              <span class="badge badge-primary badge-lg">
                {{ zonesStore.currentZone.quality.toUpperCase() }}
              </span>
            </div>

            <div class="zone-info-grid">
              <div class="info-item">
                <div class="info-icon">📍</div>
                <div>
                  <div class="info-label">Latitude</div>
                  <div class="info-value">
                    {{ zonesStore.currentZone.coordinates.latitude.toFixed(6) }}
                  </div>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon">📍</div>
                <div>
                  <div class="info-label">Longitude</div>
                  <div class="info-value">
                    {{ zonesStore.currentZone.coordinates.longitude.toFixed(6) }}
                  </div>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon">🎯</div>
                <div>
                  <div class="info-label">Altitude</div>
                  <div class="info-value">
                    {{ zonesStore.currentZone.coordinates.altitude }} meters
                  </div>
                </div>
              </div>

              <div class="info-item">
                <div class="info-icon">📏</div>
                <div>
                  <div class="info-label">Area</div>
                  <div class="info-value">
                    {{ zonesStore.currentZone.area_size_feet }} × 
                    {{ zonesStore.currentZone.area_size_feet }} feet
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Satellite Images Section -->
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Satellite Images</h3>
                <p class="card-subtitle">
                  {{ zonesStore.zoneImages.length }} image{{ zonesStore.zoneImages.length !== 1 ? 's' : '' }} collected
                </p>
              </div>
              <button @click="refreshImages" class="btn btn-secondary btn-sm" :disabled="zonesStore.loading">
                <span v-if="zonesStore.loading" class="loading"></span>
                <span v-else>🔄 Refresh</span>
              </button>
            </div>

            <!-- No Images -->
            <div v-if="!zonesStore.loading && zonesStore.zoneImages.length === 0" class="empty-state">
              <div class="empty-icon">🛰️</div>
              <div class="empty-title">No images collected yet</div>
              <p class="empty-text">
                Satellite images will appear here once they are collected by the admin.
              </p>
            </div>

            <!-- Images Grid -->
            <div v-else class="images-grid">
              <div
                v-for="image in zonesStore.zoneImages"
                :key="image.image_id"
                class="image-card"
                @click="openImageModal(image)"
              >
                <div class="image-wrapper">
                  <img :src="image.image_url" :alt="`${image.provider} satellite image`" class="satellite-image" />
                  <div class="image-overlay">
                    <span class="overlay-text">🔍 View Full</span>
                  </div>
                </div>
                <div class="image-info">
                  <div class="image-provider">{{ image.provider }}</div>
                  <div class="image-meta">
                    <span class="image-resolution">{{ image.resolution }}</span>
                    <span class="image-date">{{ formatDate(image.captured_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Zone not found</div>
          <p class="empty-text">This zone may have been removed or you don't have access to it.</p>
          <router-link to="/zones" class="btn btn-primary mt-lg">
            Back to My Zones
          </router-link>
        </div>
      </div>
    </main>

    <!-- Image Modal -->
    <div v-if="selectedImage" class="modal-overlay" @click="selectedImage = null">
      <div class="modal-container" @click.stop>
        <button class="modal-close" @click="selectedImage = null">✕</button>
        <img :src="selectedImage.image_url" :alt="`${selectedImage.provider} image`" class="modal-image" />
        <div class="modal-footer">
          <div class="modal-info">
            <div class="modal-provider">{{ selectedImage.provider }}</div>
            <div class="modal-meta">
              {{ selectedImage.resolution }} • {{ formatDate(selectedImage.captured_at) }}
            </div>
          </div>
          <a :href="selectedImage.image_url" target="_blank" class="btn btn-primary btn-sm">
            Download
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useZonesStore } from '@/stores/zones'
import type { SatelliteImage } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const zonesStore = useZonesStore()

const selectedImage = ref<SatelliteImage | null>(null)

onMounted(async () => {
  const zoneId = route.params.id as string
  await zonesStore.loadZone(zoneId)
  await zonesStore.loadZoneImages(zoneId)
})

const refreshImages = async () => {
  const zoneId = route.params.id as string
  await zonesStore.loadZoneImages(zoneId)
}

const openImageModal = (image: SatelliteImage) => {
  selectedImage.value = image
}

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--gray-50);
}

/* Header (reused styles) */
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

/* Zone Info */
.zone-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.info-item {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.info-icon {
  font-size: 24px;
}

.info-label {
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 4px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
}

.badge-lg {
  padding: 8px 16px;
  font-size: 14px;
}

/* Images Grid */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.image-card {
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 aspect ratio */
  background: var(--gray-200);
  overflow: hidden;
}

.satellite-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.overlay-text {
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.image-info {
  padding: var(--spacing-md);
  background: white;
}

.image-provider {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--spacing-xs);
}

.image-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--gray-500);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.modal-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-image {
  max-width: 100%;
  max-height: calc(90vh - 100px);
  object-fit: contain;
  border-radius: var(--radius-lg);
}

.modal-footer {
  background: white;
  padding: var(--spacing-md);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-sm);
}

.modal-provider {
  font-size: 16px;
  font-weight: 600;
  color: var(--gray-800);
}

.modal-meta {
  font-size: 12px;
  color: var(--gray-500);
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

  .images-grid {
    grid-template-columns: 1fr;
  }

  .zone-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
