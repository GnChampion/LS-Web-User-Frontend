<template>
  <div class="page">
    <AppHeader />

    <main class="main-content">
      <div class="container">
        <button @click="$router.back()" class="btn btn-secondary mb-lg">← Back to Zones</button>

        <!-- Loading -->
        <div v-if="zoneLoading" class="loading-container">
          <div class="loading loading-lg"></div>
          <p class="text-muted mt-md">Loading zone…</p>
        </div>

        <template v-else-if="zonesStore.currentZone">
          <!-- Zone info card -->
          <div class="card mb-lg">
            <div class="card-header">
              <div>
                <h2 class="card-title">{{ zonesStore.currentZone.zone_name }}</h2>
                <p class="card-subtitle">{{ zonesStore.currentZone.zone_id }}</p>
              </div>
              <div class="header-actions">
                <span class="badge badge-primary badge-lg">
                  {{ (zonesStore.currentZone.quality ?? 'N/A').toUpperCase() }}
                </span>
                <button
                  class="btn btn-primary btn-sm"
                  :disabled="triggerLoading"
                  @click="triggerAnalysis"
                >
                  <span v-if="triggerLoading" class="loading"></span>
                  <span v-else>🛰️ Collect Data</span>
                </button>
              </div>
            </div>

            <div class="zone-info-grid">
              <div class="info-item">
                <div class="info-icon">📍</div>
                <div>
                  <div class="info-label">Latitude</div>
                  <div class="info-value">{{ zonesStore.currentZone.coordinates?.latitude?.toFixed(6) ?? 'N/A' }}</div>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">📍</div>
                <div>
                  <div class="info-label">Longitude</div>
                  <div class="info-value">{{ zonesStore.currentZone.coordinates?.longitude?.toFixed(6) ?? 'N/A' }}</div>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">📏</div>
                <div>
                  <div class="info-label">Area</div>
                  <div class="info-value">{{ zonesStore.currentZone.area_size_feet }} × {{ zonesStore.currentZone.area_size_feet }} ft</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Delivery section -->
          <div class="card">
            <!-- Module selector tabs -->
            <DataTypeSelector
              v-model="activeModule"
              :deliveries="deliveryStore.deliveries"
            />

            <!-- Content area -->
            <div class="delivery-body">
              <!-- Trigger error -->
              <div v-if="triggerError" class="alert alert-error mb-md">{{ triggerError }}</div>

              <!-- No data yet for this module -->
              <div v-if="!activeDelivery" class="empty-state">
                <div class="empty-icon">🛰️</div>
                <div class="empty-title">No data collected yet</div>
                <p class="empty-text">Click "Collect Data" to start satellite data collection for this zone.</p>
              </div>

              <!-- Delivery compare (two-path) -->
              <DeliveryCompare v-else :data="activeDelivery" />
            </div>
          </div>
        </template>

        <!-- Zone not found -->
        <div v-else class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Zone not found</div>
          <router-link to="/zones" class="btn btn-primary mt-lg">Back to My Zones</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useZonesStore } from '@/stores/zones'
import { useDeliveryStore, type ModuleName } from '@/stores/delivery'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'
import AppHeader from '@/components/AppHeader.vue'
import DataTypeSelector from '@/components/DataTypeSelector.vue'
import DeliveryCompare from '@/components/DeliveryCompare.vue'

const route = useRoute()
const zonesStore = useZonesStore()
const deliveryStore = useDeliveryStore()
const authStore = useAuthStore()

const zoneLoading = ref(false)
const triggerLoading = ref(false)
const triggerError = ref<string | null>(null)
const activeModule = ref<ModuleName>('optical')

const activeDelivery = computed(() => deliveryStore.getModule(activeModule.value) ?? null)

onMounted(async () => {
  const zoneId = route.params.id as string
  zoneLoading.value = true
  await zonesStore.loadZone(zoneId)
  zoneLoading.value = false
  // Start realtime listener for all modules
  deliveryStore.watchZone(zoneId)
})

onUnmounted(() => {
  deliveryStore.stopWatching()
})

async function triggerAnalysis() {
  const zone = zonesStore.currentZone
  if (!zone) return
  triggerLoading.value = true
  triggerError.value = null
  try {
    await apiService.triggerTask({
      zone_id: zone.zone_id,
      modules: [activeModule.value],
      requirement: { aoi_version: 'v1', output_type: 'image', resolution: 'high' },
    })
    // Listener will auto-update when data arrives
  } catch (e: any) {
    triggerError.value = e?.response?.data?.detail || e?.message || 'Failed to trigger task'
  } finally {
    triggerLoading.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--gray-50, #f9fafb); }
.main-content { padding: var(--spacing-xl, 32px) 0; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid var(--gray-100, #f3f4f6);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zone-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-lg, 24px);
  padding: 20px;
}

.info-item { display: flex; gap: 12px; align-items: flex-start; }
.info-icon { font-size: 22px; }
.info-label { font-size: 11px; color: var(--gray-500, #6b7280); margin-bottom: 2px; }
.info-value { font-size: 15px; font-weight: 600; color: var(--gray-800, #1f2937); }

.badge-lg { padding: 6px 14px; font-size: 13px; }

.delivery-body { padding: 20px; }

.alert-error {
  background: #fee2e2;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.loading-container { text-align: center; padding: 60px; }

.empty-state { text-align: center; padding: 48px 20px; }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-title { font-size: 18px; font-weight: 600; color: var(--gray-700, #374151); margin-bottom: 8px; }
.empty-text { font-size: 14px; color: var(--gray-500, #6b7280); max-width: 360px; margin: 0 auto; }

@media (max-width: 640px) {
  .card-header { flex-direction: column; gap: 12px; }
  .header-actions { width: 100%; justify-content: space-between; }
}
</style>
