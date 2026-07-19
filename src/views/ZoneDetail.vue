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

        <template v-else-if="zone">
          <!-- Zone info card -->
          <div class="card mb-lg">
            <div class="card-header">
              <div>
                <h2 class="card-title">{{ zone.zone_name || zone.zone_id }}</h2>
                <p class="card-subtitle">{{ zone.zone_id }}</p>
              </div>
              <div class="header-actions">
                <span class="badge badge-lg" :class="statusBadgeClass">{{ (zone.status || 'active').replace('_', ' ') }}</span>
                <span class="badge badge-primary badge-lg">{{ (zone.quality ?? 'N/A').toUpperCase() }}</span>
              </div>
            </div>

            <!-- Zone meta grid -->
            <div class="zone-info-grid">
              <div class="info-item">
                <div class="info-icon">📍</div>
                <div>
                  <div class="info-label">Latitude</div>
                  <div class="info-value">{{ lat !== null ? lat.toFixed(6) : 'N/A' }}</div>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">📍</div>
                <div>
                  <div class="info-label">Longitude</div>
                  <div class="info-value">{{ lon !== null ? lon.toFixed(6) : 'N/A' }}</div>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">📏</div>
                <div>
                  <div class="info-label">Area</div>
                  <div class="info-value">{{ zone.area_size_feet ? `${zone.area_size_feet} × ${zone.area_size_feet} ft` : 'N/A' }}</div>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">🗺️</div>
                <div>
                  <div class="info-label">AOI Type</div>
                  <div class="info-value">{{ zone.confirmed_v2 ? 'Polygon (V2)' : 'Point (V1)' }}</div>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">🕐</div>
                <div>
                  <div class="info-label">Created</div>
                  <div class="info-value">{{ fmtDate(zone.created_at) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Collection controls card -->
          <div class="card mb-lg">
            <div class="controls-header">
              <h3 class="controls-title">🛰️ Data Collection</h3>
            </div>
            <div class="controls-grid">
              <!-- Date -->
              <div class="control-group">
                <label class="control-label">📅 Date</label>
                <select v-model="dateMode" class="control-select">
                  <option value="today">Today (live)</option>
                  <option value="custom">Custom date</option>
                </select>
                <input
                  v-if="dateMode === 'custom'"
                  v-model="customDate"
                  type="date"
                  class="control-input mt-xs"
                  :max="todayStr"
                />
              </div>

              <!-- Resolution -->
              <div class="control-group">
                <label class="control-label">📐 Resolution</label>
                <select v-model="selectedResolution" class="control-select">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <!-- Provider -->
              <div class="control-group">
                <label class="control-label">🔭 Provider</label>
                <select v-model="selectedProvider" class="control-select">
                  <option value="">Auto (best available)</option>
                  <optgroup label="Zero-auth (no credentials needed)">
                    <option value="earth-search">Element84 Earth Search (Sentinel-2 10m)</option>
                    <option value="planetary-computer">Planetary Computer (Sentinel-2/Landsat)</option>
                    <option value="gibs">NASA GIBS (MODIS 250m)</option>
                    <option value="landsatlook">USGS LandsatLook (Landsat 30m)</option>
                    <option value="open-aerial-map">OpenAerialMap (Drone/Aerial)</option>
                  </optgroup>
                  <optgroup label="Requires credentials">
                    <option value="sentinel-2-dse">Sentinel-2 DSE (needs Copernicus account)</option>
                    <option value="gee">Google Earth Engine (needs service account)</option>
                  </optgroup>
                </select>
              </div>

              <!-- Modules -->
              <div class="control-group control-group-wide">
                <label class="control-label">📡 Modules</label>
                <div class="module-checkboxes">
                  <label
                    v-for="m in ALL_MODULES"
                    :key="m.key"
                    class="module-check"
                    :class="{ checked: selectedModules.includes(m.key) }"
                  >
                    <input
                      type="checkbox"
                      :value="m.key"
                      v-model="selectedModules"
                      class="sr-only"
                    />
                    {{ m.icon }} {{ m.label }}
                  </label>
                </div>
              </div>
            </div>

            <div class="controls-footer">
              <div v-if="triggerError" class="alert-error">{{ triggerError }}</div>
              <div v-if="triggerSuccess" class="alert-success">{{ triggerSuccess }}</div>
              <button
                class="btn btn-primary"
                :disabled="triggerLoading || selectedModules.length === 0"
                @click="triggerAnalysis"
              >
                <span v-if="triggerLoading" class="loading"></span>
                <span v-else>🛰️ Collect Data ({{ selectedModules.length }} module{{ selectedModules.length !== 1 ? 's' : '' }})</span>
              </button>
            </div>
          </div>

          <!-- Delivery results card -->
          <div class="card">
            <DataTypeSelector v-model="activeModule" :deliveries="deliveryStore.deliveries" />

            <div class="delivery-body">
              <!-- No data yet -->
              <div v-if="!activeDelivery" class="empty-state">
                <div class="empty-icon">🛰️</div>
                <div class="empty-title">No data collected yet</div>
                <p class="empty-text">Configure your collection settings above and click "Collect Data".</p>
              </div>

              <DeliveryCompare v-else :data="activeDelivery" :module="activeModule" />
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
import { apiService } from '@/services/api'
import AppHeader from '@/components/AppHeader.vue'
import DataTypeSelector from '@/components/DataTypeSelector.vue'
import DeliveryCompare from '@/components/DeliveryCompare.vue'

const route = useRoute()
const zonesStore = useZonesStore()
const deliveryStore = useDeliveryStore()

const ALL_MODULES = [
  { key: 'optical' as ModuleName,    label: 'Optical',    icon: '🛰️' },
  { key: 'weather' as ModuleName,    label: 'Weather',    icon: '🌤️' },
  { key: 'elevation' as ModuleName,  label: 'Elevation',  icon: '⛰️' },
  { key: 'radar' as ModuleName,      label: 'Radar',      icon: '📡' },
  { key: 'land-cover' as ModuleName, label: 'Land Cover', icon: '🌿' },
  { key: 'hydrology' as ModuleName,  label: 'Hydrology',  icon: '💧' },
  { key: 'spectral' as ModuleName,   label: 'Spectral',   icon: '🔬' },
]

const todayStr = new Date().toISOString().slice(0, 10)

const zoneLoading    = ref(false)
const triggerLoading = ref(false)
const triggerError   = ref<string | null>(null)
const triggerSuccess = ref<string | null>(null)
const activeModule   = ref<ModuleName>('optical')

// Collection controls
const dateMode         = ref<'today' | 'custom'>('today')
const customDate       = ref(todayStr)
const selectedResolution = ref<'high' | 'medium' | 'low'>('high')
const selectedProvider = ref('')
const selectedModules  = ref<ModuleName[]>(['optical'])

const zone = computed(() => zonesStore.currentZone)

const lat = computed(() => {
  const z = zone.value
  if (!z) return null
  return z.confirmed_v1?.lat
    ?? z.coordinates?.latitude
    ?? z.xy?.lat
    ?? (z as any).lat
    ?? null
})

const lon = computed(() => {
  const z = zone.value
  if (!z) return null
  return z.confirmed_v1?.lon
    ?? z.coordinates?.longitude
    ?? z.xy?.lon
    ?? (z as any).lon ?? (z as any).lng
    ?? null
})

const statusBadgeClass = computed(() => {
  const s = zone.value?.status
  if (s === 'active') return 'badge-success'
  if (s === 'blocked') return 'badge-danger'
  return 'badge-warning'
})

const activeDelivery = computed(() => deliveryStore.getModule(activeModule.value) ?? null)

onMounted(async () => {
  const zoneId = route.params.id as string
  zoneLoading.value = true
  await zonesStore.loadZone(zoneId)
  zoneLoading.value = false
  // Force re-watch even if same zone (fix guard bug)
  deliveryStore.stopWatching()
  deliveryStore.watchZone(zoneId)
  // Pre-select resolution from zone quality
  const q = zonesStore.currentZone?.quality
  if (q === 'low') selectedResolution.value = 'low'
  else if (q === 'medium') selectedResolution.value = 'medium'
  else selectedResolution.value = 'high'
})

onUnmounted(() => {
  deliveryStore.stopWatching()
})

async function triggerAnalysis() {
  const z = zone.value
  if (!z || selectedModules.value.length === 0) return
  triggerLoading.value = true
  triggerError.value = null
  triggerSuccess.value = null
  try {
    const aoi_version = z.confirmed_v2 ? 'v2' : 'v1'
    const time = dateMode.value === 'custom' ? customDate.value : 'live'
    const result = await apiService.triggerTask({
      zone_id: z.zone_id,
      modules: selectedModules.value,
      requirement: {
        aoi_version,
        output_type: 'image',
        resolution: selectedResolution.value,
        ...(selectedProvider.value ? { provider: selectedProvider.value } : {}),
        time,
      },
      force_refresh: true,
    })
    const created = (result?.tasks ?? []).filter((t: any) => t.status === 'created').length
    const cached  = (result?.tasks ?? []).filter((t: any) => t.status === 'cache_hit').length
    triggerSuccess.value = `Triggered ${created} module${created !== 1 ? 's' : ''}${cached ? `, ${cached} from cache` : ''}. Results will appear below.`
  } catch (e: any) {
    triggerError.value = e?.response?.data?.detail || e?.message || 'Failed to trigger task'
  } finally {
    triggerLoading.value = false
  }
}

function fmtDate(d: any): string {
  if (!d) return 'N/A'
  try {
    const ts = d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
    return ts.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch { return 'N/A' }
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

.header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.zone-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  padding: 20px;
}

.info-item { display: flex; gap: 10px; align-items: flex-start; }
.info-icon { font-size: 20px; }
.info-label { font-size: 11px; color: var(--gray-500, #6b7280); margin-bottom: 2px; }
.info-value { font-size: 14px; font-weight: 600; color: var(--gray-800, #1f2937); }

/* Controls */
.controls-header { padding: 16px 20px 0; }
.controls-title { font-size: 15px; font-weight: 600; color: var(--gray-800, #1f2937); margin: 0; }

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  padding: 16px 20px;
}

.control-group { display: flex; flex-direction: column; gap: 6px; }
.control-group-wide { grid-column: 1 / -1; }
.control-label { font-size: 12px; font-weight: 600; color: var(--gray-600, #4b5563); }
.control-select, .control-input {
  padding: 7px 10px;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 6px;
  font-size: 13px;
  background: white;
  color: var(--gray-800, #1f2937);
}
.control-select:focus, .control-input:focus {
  outline: none;
  border-color: var(--primary, #2563eb);
}
.mt-xs { margin-top: 4px; }

.module-checkboxes { display: flex; flex-wrap: wrap; gap: 8px; }
.module-check {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: var(--gray-600, #4b5563);
  background: white;
  transition: all 0.15s;
  user-select: none;
}
.module-check.checked {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
}
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

.controls-footer {
  padding: 12px 20px 16px;
  border-top: 1px solid var(--gray-100, #f3f4f6);
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.alert-error {
  background: #fee2e2; color: #b91c1c;
  padding: 8px 14px; border-radius: 6px; font-size: 13px; width: 100%;
}
.alert-success {
  background: #dcfce7; color: #15803d;
  padding: 8px 14px; border-radius: 6px; font-size: 13px; width: 100%;
}

/* Badges */
.badge-lg { padding: 5px 12px; font-size: 12px; border-radius: 20px; font-weight: 600; text-transform: capitalize; }
.badge-success { background: #dcfce7; color: #15803d; }
.badge-danger  { background: #fee2e2; color: #b91c1c; }
.badge-warning { background: #fef9c3; color: #a16207; }

.delivery-body { padding: 20px; }

.loading-container { text-align: center; padding: 60px; }
.empty-state { text-align: center; padding: 48px 20px; }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-title { font-size: 18px; font-weight: 600; color: var(--gray-700, #374151); margin-bottom: 8px; }
.empty-text { font-size: 14px; color: var(--gray-500, #6b7280); max-width: 360px; margin: 0 auto; }

@media (max-width: 640px) {
  .card-header { flex-direction: column; gap: 12px; }
  .header-actions { width: 100%; }
  .controls-grid { grid-template-columns: 1fr; }
}
</style>
