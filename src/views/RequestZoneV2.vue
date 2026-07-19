<template>
  <div class="page">
    <AppHeader />

    <main class="main-content">
      <div class="container-sm">
        <button @click="$router.back()" class="btn btn-secondary mb-lg">← Back</button>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Request a Zone</h2>
            <p class="card-subtitle">Choose a zone type, then mark your area on the map.</p>
          </div>

          <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
          <div v-if="pendingMessage" class="alert alert-warning">{{ pendingMessage }}</div>
          <div v-if="assignedMessage" class="alert alert-info">{{ assignedMessage }}</div>
          <div v-if="zonesStore.error" class="alert alert-error">{{ zonesStore.error }}</div>

          <form @submit.prevent="handleSubmit">
            <!-- Mode toggle -->
            <div class="form-group">
              <label class="form-label">Zone Type</label>
              <div class="mode-toggle">
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: mode === 'v1' }"
                  @click="setMode('v1')"
                >
                  📍 Point (v1)
                  <span class="mode-desc">Single coordinate pin</span>
                </button>
                <button
                  type="button"
                  class="mode-btn"
                  :class="{ active: mode === 'v2' }"
                  @click="setMode('v2')"
                >
                  🔷 Polygon (v2)
                  <span class="mode-desc">Draw a border (3+ points)</span>
                </button>
              </div>
            </div>

            <!-- Map -->
            <div class="form-group">
              <label class="form-label">Mark on Map</label>
              <DrawZone
                :api-key="googleMapsApiKey"
                :version="mode"
                :point="point"
                :polygon="polygon"
                :center="mapCenter"
                :zoom="14"
                height="420px"
                @update:point="onPoint"
                @update:polygon="onPolygon"
              />
              <p class="form-hint" v-if="mode === 'v1'">Click once on the map to drop a point marker.</p>
              <p class="form-hint" v-else>Click 3+ times to draw a polygon border.</p>
            </div>

            <!-- Status indicators -->
            <div class="form-group">
              <div class="status-tags">
                <span v-if="mode === 'v1'" class="stag" :class="{ on: hasV1 }">
                  📍 Point {{ hasV1 ? `✓ (${lat?.toFixed(4)}, ${lon?.toFixed(4)})` : '— not set' }}
                </span>
                <span v-else class="stag" :class="{ on: hasV2 }">
                  🔷 Polygon {{ hasV2 ? `✓ (${polygon.length} pts)` : '— not drawn (3+ pts needed)' }}
                </span>
              </div>
            </div>

            <div class="info-box">
              <div class="info-icon">ℹ️</div>
              <div class="info-text">
                Zone creation is instant. After creation, go to the zone page to configure and run data collection (resolution, provider, modules, etc.).
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="$router.back()" :disabled="loading">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="loading || !canSubmit">
                <span v-if="loading" class="loading"></span>
                <span v-else>Create Zone</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useZonesStore } from '@/stores/zones'
import DrawZone from '@/components/DrawZone.vue'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()
const zonesStore = useZonesStore()

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const successMessage  = ref('')
const pendingMessage  = ref('')
const assignedMessage = ref('')

onMounted(() => {
  zonesStore.clearError()
})
const loading = ref(false)

const mode    = ref<'v1' | 'v2'>('v1')
const lat     = ref<number | null>(null)
const lon     = ref<number | null>(null)
const point   = ref<{ lat: number; lng: number } | null>(null)
const polygon = ref<[number, number][]>([])

const hasV1 = computed(() => lat.value !== null && lon.value !== null)
const hasV2 = computed(() => polygon.value.length >= 3)
// Backend V2 requires ≥4 points (closed polygon); auto-close before sending
function closedPolygon(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) return pts
  const first = pts[0], last = pts[pts.length - 1]
  // Check if already closed
  if (first[0] === last[0] && first[1] === last[1]) return pts
  // Auto-close by adding first point at end
  return [...pts, first]
}
const canSubmit = computed(() => mode.value === 'v1' ? hasV1.value : hasV2.value)

// Debug helper to log the actual payload
function debugPayload(v1: any, v2: any) {
  console.log('[RequestZoneV2] Payload being sent:', JSON.stringify({ v1, v2 }, null, 2))
}

const mapCenter = computed(() => {
  if (lat.value && lon.value) return { lat: lat.value, lng: lon.value }
  return { lat: 11.0168, lng: 76.9558 }
})

function setMode(m: 'v1' | 'v2') {
  mode.value = m
  if (m === 'v1') {
    polygon.value = []
  } else {
    lat.value = null
    lon.value = null
    point.value = null
  }
  zonesStore.clearError()
}

function onPoint(p: { lat: number; lng: number }) {
  lat.value = parseFloat(p.lat.toFixed(6))
  lon.value = parseFloat(p.lng.toFixed(6))
  point.value = p
}

function onPolygon(pts: [number, number][]) {
  polygon.value = pts
}

async function handleSubmit() {
  zonesStore.clearError()
  successMessage.value = ''
  pendingMessage.value = ''
  assignedMessage.value = ''

  const v1 = mode.value === 'v1' && hasV1.value
    ? { lat: lat.value!, lon: lon.value! }
    : null
  const v2 = mode.value === 'v2' && hasV2.value
    ? { coordinates: closedPolygon(polygon.value) }
    : null

  if (!v1 && !v2) {
    zonesStore.setError(mode.value === 'v1'
      ? 'Please drop a point on the map first.'
      : 'Please draw a polygon on the map first (3+ points).')
    return
  }

  // Debug logging
  debugPayload(v1, v2)

  // Validate v2 has at least 4 points after closing
  if (v2 && v2.coordinates.length < 4) {
    zonesStore.setError('Polygon must have at least 3 points (4 after auto-closing)')
    return
  }

  loading.value = true
  const result = await zonesStore.requestZoneV2(v1, v2)
  loading.value = false

  if (!result) {
    // error already set by requestZoneV2 catch block
    return
  }

  if (result.status === 'created') {
    successMessage.value = 'Zone created! Redirecting to your zones…'
    setTimeout(() => router.push('/zones'), 1500)
    return
  }

  if (result.status === 'assigned') {
    assignedMessage.value = result.message || 'An existing zone at this location has been assigned to your account.'
    setTimeout(() => router.push('/zones'), 2500)
    return
  }

  if (result.status === 'pending_admin') {
    pendingMessage.value = result.message || 'Your zone request is pending admin review due to overlap with an existing zone.'
    return
  }

  if (result.status === 'blocked') {
    zonesStore.setError(result.message || 'A zone already exists at this location.')
    return
  }

  zonesStore.setError(result.message || 'Unexpected response from server.')
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--gray-50); }
.main-content { padding: var(--spacing-xl) 0; }

.mode-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 16px;
  border: 2px solid var(--gray-200, #e5e7eb);
  border-radius: 10px;
  background: white;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-500, #6b7280);
  transition: all 0.15s;
}
.mode-btn:hover { border-color: var(--primary, #2563eb); color: var(--primary, #2563eb); }
.mode-btn.active {
  border-color: var(--primary, #2563eb);
  background: #eff6ff;
  color: var(--primary, #2563eb);
}
.mode-desc {
  font-size: 11px;
  font-weight: 400;
  color: inherit;
  opacity: 0.8;
}

.status-tags { display: flex; gap: 8px; }
.stag {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--gray-200, #e5e7eb);
  color: var(--gray-400, #9ca3af);
  background: white;
}
.stag.on { background: #dcfce7; border-color: #86efac; color: #15803d; }

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
}

.info-box {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(66, 153, 225, 0.08);
  border: 1px solid rgba(66, 153, 225, 0.25);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}
.info-icon { font-size: 20px; flex-shrink: 0; }
.info-text { font-size: 13px; color: var(--gray-600, #4b5563); line-height: 1.5; }
.form-hint { font-size: 13px; color: var(--gray-500); margin-top: var(--spacing-sm); }

.alert-warning {
  background: #fef9c3;
  color: #a16207;
  border: 1px solid #fde047;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}
.alert-info {
  background: #dbeafe;
  color: #1d4ed8;
  border: 1px solid #93c5fd;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

@media (max-width: 640px) {
  .mode-toggle { grid-template-columns: 1fr; }
  .form-actions { flex-direction: column; }
  .form-actions .btn { width: 100%; }
}
</style>
