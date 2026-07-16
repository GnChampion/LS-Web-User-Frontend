<template>
  <div class="page">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="header-brand"><h1 class="brand-title">🛰️ Land Scanner</h1></div>
          <nav class="header-nav">
            <router-link to="/" class="nav-link">Dashboard</router-link>
            <router-link to="/zones" class="nav-link">My Zones</router-link>
            <router-link to="/requests" class="nav-link">Requests</router-link>
            <router-link to="/profile" class="nav-link">Profile</router-link>
            <button @click="handleLogout" class="btn btn-secondary btn-sm">Logout</button>
          </nav>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="container-sm">
        <button @click="$router.back()" class="btn btn-secondary mb-lg">← Back</button>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Request a Zone (v1 point + v2 border)</h2>
            <p class="card-subtitle">
              Point your zone (v1) and optionally draw its border (v2, 3+ points).
              Both are stored; v1 and v2 are separate areas.
            </p>
          </div>

          <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>

          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label class="form-label" for="zoneName">Zone Name *</label>
              <input id="zoneName" v-model="formData.zoneName" type="text" class="form-input"
                     placeholder="e.g., Farm Land Area 1" required :disabled="loading" />
            </div>

            <div class="form-group">
              <label class="form-label">Zone area on map</label>
              <DrawZone
                :api-key="googleMapsApiKey"
                :version="drawMode"
                :point="point"
                :polygon="polygon"
                :center="mapCenter"
                :zoom="14"
                height="420px"
                @update:point="onPoint"
                @update:polygon="onPolygon"
              />
              <p class="form-hint">
                v1: click once to drop the point marker. v2: switch to “Draw v2 border” and click 3+ times.
              </p>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="latitude">Latitude (v1) *</label>
                <input id="latitude" v-model.number="formData.latitude" type="number" step="any"
                       class="form-input" placeholder="11.0168" required min="-90" max="90" :disabled="loading" />
              </div>
              <div class="form-group">
                <label class="form-label" for="longitude">Longitude (v1) *</label>
                <input id="longitude" v-model.number="formData.longitude" type="number" step="any"
                       class="form-input" placeholder="76.9558" required min="-180" max="180" :disabled="loading" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="altitude">Altitude (meters) *</label>
                <input id="altitude" v-model.number="formData.altitude" type="number" class="form-input"
                       placeholder="100" required :disabled="loading" />
              </div>
              <div class="form-group">
                <label class="form-label" for="areaSize">Area Size (feet) *</label>
                <input id="areaSize" v-model.number="formData.areaSize" type="number" class="form-input"
                       placeholder="50" required min="1" :disabled="loading" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="quality">Image Quality *</label>
              <select id="quality" v-model="formData.quality" class="form-select" required :disabled="loading">
                <option value="low">Low (Quick Preview)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="high" selected>High (Detailed)</option>
                <option value="ultra">Ultra (Maximum Detail)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">v2 drawn border ({{ polygon.length }} points)</label>
              <div class="version-tags">
                <span class="vt vt-v1" :class="{ on: hasV1 }">v1 point {{ hasV1 ? '✓' : '' }}</span>
                <span class="vt vt-v2" :class="{ on: hasV2 }">v2 border {{ hasV2 ? '✓' : '' }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="notes">Additional Notes (Optional)</label>
              <textarea id="notes" v-model="formData.notes" class="form-textarea"
                        placeholder="Any specific requirements or details..." rows="4" :disabled="loading"></textarea>
            </div>

            <div class="info-box">
              <div class="info-icon">ℹ️</div>
              <div class="info-text">
                <strong>Note:</strong> Your request is reviewed by an administrator (or auto-approved by Autopilot).
                Once approved, the zone is collected and the delivered data appears under <em>My Zones</em>.
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="$router.back()" :disabled="loading">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="loading"></span>
                <span v-else>Submit Zone</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useZonesStore } from '@/stores/zones'
import DrawZone from '@/components/DrawZone.vue'
import { BACKEND_URL } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const zonesStore = useZonesStore()

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const successMessage = ref('')
const error = ref('')
const loading = ref(false)
const drawMode = ref<'v1' | 'v2'>('v1')

const formData = reactive({
  zoneName: '',
  latitude: null as number | null,
  longitude: null as number | null,
  altitude: 100,
  areaSize: 50,
  quality: 'high',
  notes: ''
})

const point = ref<{ lat: number; lng: number } | null>(null)
const polygon = ref<[number, number][]>([])

const hasV1 = computed(() => !!formData.latitude && !!formData.longitude)
const hasV2 = computed(() => polygon.value.length >= 3)

const mapCenter = computed(() => {
  if (formData.latitude && formData.longitude) return { lat: formData.latitude, lng: formData.longitude }
  return { lat: 11.0168, lng: 76.9558 }
})

function onPoint(p: { lat: number; lng: number }) {
  formData.latitude = parseFloat(p.lat.toFixed(6))
  formData.longitude = parseFloat(p.lng.toFixed(6))
}
function onPolygon(pts: [number, number][]) {
  polygon.value = pts
}

const handleSubmit = async () => {
  zonesStore.clearError()
  error.value = ''
  successMessage.value = ''
  loading.value = true

  if (!formData.latitude || !formData.longitude) {
    error.value = 'Please provide valid v1 coordinates (point on the map).'
    loading.value = false
    return
  }

  const success = await zonesStore.requestNewZone({
    user_id: authStore.userId,
    coordinates: {
      latitude: formData.latitude,
      longitude: formData.longitude,
      altitude: formData.altitude || 100
    },
    zone_area: formData.areaSize ? { size_feet: formData.areaSize } : undefined,
    quality: formData.quality,
    notes: formData.notes || undefined
  })

  loading.value = false

  if (zonesStore.error && (zonesStore.error.includes('Network Error') || zonesStore.error.includes('fetch'))) {
    error.value = 'Cannot connect to backend server. Make sure the backend is running at ' + BACKEND_URL
  } else if (!success && zonesStore.error) {
    error.value = zonesStore.error
  }

  if (success) {
    successMessage.value = 'Zone request submitted successfully!'
    setTimeout(() => router.push('/requests'), 2000)
  }
}

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--gray-50); }
.header { background: white; border-bottom: 1px solid var(--gray-200); padding: var(--spacing-md) 0; position: sticky; top: 0; z-index: 100; }
.header-content { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-lg); }
.brand-title { font-size: 20px; font-weight: 700; color: var(--gray-800); margin: 0; }
.header-nav { display: flex; align-items: center; gap: var(--spacing-md); }
.nav-link { padding: 8px 16px; border-radius: var(--radius-md); font-size: 14px; font-weight: 500; color: var(--gray-600); transition: all 0.2s; }
.nav-link:hover { background: var(--gray-100); color: var(--gray-800); }
.nav-link.active { background: var(--primary); color: white; }
.main-content { padding: var(--spacing-xl) 0; }
.form-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
.form-actions { display: flex; gap: var(--spacing-md); justify-content: flex-end; margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--gray-200); }
.info-box { display: flex; gap: var(--spacing-md); padding: var(--spacing-md); background: rgba(66, 153, 225, 0.1); border: 1px solid rgba(66, 153, 225, 0.3); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg); }
.info-icon { font-size: 20px; flex-shrink: 0; }
.info-text { font-size: 14px; color: var(--gray-700); line-height: 1.5; }
.form-hint { font-size: 13px; color: var(--gray-500); margin-top: var(--spacing-sm); }
.version-tags { display: flex; gap: 8px; }
.vt { padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; border: 1px solid var(--gray-200); color: var(--gray-400); }
.vt.on { color: white; }
.vt-v1.on { background: #dc2626; border-color: #dc2626; }
.vt-v2.on { background: #2563eb; border-color: #2563eb; }
@media (max-width: 768px) {
  .header-nav { display: none; }
  .form-row { grid-template-columns: 1fr; }
  .form-actions { flex-direction: column; }
  .form-actions .btn { width: 100%; }
}
</style>
