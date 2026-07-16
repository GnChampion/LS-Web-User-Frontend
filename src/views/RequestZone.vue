<template>
  <div class="page">
    <AppHeader />

    <!-- Main Content -->
    <main class="main-content">
      <div class="container-sm">
        <button @click="$router.back()" class="btn btn-secondary mb-lg">
          ← Back
        </button>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Request New Zone</h2>
            <p class="card-subtitle">
              Submit a request for a new monitoring zone. Admin will review and approve.
            </p>
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="alert alert-success">
            {{ successMessage }}
          </div>

          <!-- Error Message -->
          <div v-if="zonesStore.error" class="alert alert-error">
            {{ zonesStore.error }}
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label class="form-label" for="zoneName">Zone Name *</label>
              <input
                id="zoneName"
                v-model="formData.zoneName"
                type="text"
                class="form-input"
                placeholder="e.g., Farm Land Area 1"
                required
                :disabled="zonesStore.loading"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Pick Location on Map</label>
              <GoogleMap
                :api-key="googleMapsApiKey"
                :center="mapCenter"
                :zoom="14"
                height="320px"
                clickable
                @map-click="handleMapClick"
              />
              <p class="form-hint">Click on the map to set coordinates, or enter them manually below.</p>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="latitude">Latitude *</label>
                <input
                  id="latitude"
                  v-model.number="formData.latitude"
                  type="number"
                  step="any"
                  class="form-input"
                  placeholder="11.0168"
                  required
                  min="-90"
                  max="90"
                  :disabled="zonesStore.loading"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="longitude">Longitude *</label>
                <input
                  id="longitude"
                  v-model.number="formData.longitude"
                  type="number"
                  step="any"
                  class="form-input"
                  placeholder="76.9558"
                  required
                  min="-180"
                  max="180"
                  :disabled="zonesStore.loading"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="altitude">Altitude (meters) *</label>
                <input
                  id="altitude"
                  v-model.number="formData.altitude"
                  type="number"
                  class="form-input"
                  placeholder="100"
                  required
                  :disabled="zonesStore.loading"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="areaSize">Area Size (feet) *</label>
                <input
                  id="areaSize"
                  v-model.number="formData.areaSize"
                  type="number"
                  class="form-input"
                  placeholder="50"
                  required
                  min="1"
                  :disabled="zonesStore.loading"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="quality">Image Quality *</label>
              <select
                id="quality"
                v-model="formData.quality"
                class="form-select"
                required
                :disabled="zonesStore.loading"
              >
                <option value="low">Low (Quick Preview)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="high">High (Detailed)</option>
                <option value="ultra">Ultra (Maximum Detail)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="notes">Additional Notes (Optional)</label>
              <textarea
                id="notes"
                v-model="formData.notes"
                class="form-textarea"
                placeholder="Any specific requirements or details..."
                rows="4"
                :disabled="zonesStore.loading"
              ></textarea>
            </div>

            <!-- Info Box -->
            <div class="info-box">
              <div class="info-icon">ℹ️</div>
              <div class="info-text">
                <strong>Note:</strong> Your request will be reviewed by an administrator.
                You'll be notified once it's approved and the zone is assigned to your account.
              </div>
            </div>

            <div class="form-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="$router.back()"
                :disabled="zonesStore.loading"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="zonesStore.loading"
              >
                <span v-if="zonesStore.loading" class="loading"></span>
                <span v-else>Submit Request</span>
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
import GoogleMap from '@/components/GoogleMap.vue'
import AppHeader from '@/components/AppHeader.vue'
import { BACKEND_URL } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()
const zonesStore = useZonesStore()

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const successMessage = ref('')

const formData = reactive({
  zoneName: '',
  latitude: null as number | null,
  longitude: null as number | null,
  altitude: 100,
  areaSize: 50,
  quality: 'high',
  notes: ''
})

const mapCenter = computed(() => {
  if (formData.latitude && formData.longitude) {
    return { lat: formData.latitude, lng: formData.longitude }
  }
  return { lat: 11.0168, lng: 76.9558 }
})

const handleMapClick = (latLng: { lat: number; lng: number }) => {
  formData.latitude = parseFloat(latLng.lat.toFixed(6))
  formData.longitude = parseFloat(latLng.lng.toFixed(6))
}

const handleSubmit = async () => {
  zonesStore.clearError()
  successMessage.value = ''

  if (formData.latitude === null || formData.longitude === null) {
    zonesStore.setError('Please provide valid coordinates')
    return
  }

  const success = await zonesStore.requestNewZone({
    user_id: authStore.userId,
    zone_name: formData.zoneName,
    coordinates: {
      latitude: formData.latitude,
      longitude: formData.longitude,
      altitude: formData.altitude || 100
    },
    zone_area: formData.areaSize ? { size_feet: formData.areaSize } : undefined,
    quality: formData.quality,
    notes: formData.notes || undefined
  })

  if (!success && zonesStore.error) {
    if (zonesStore.error.includes('Network Error') || zonesStore.error.includes('ERR_CONNECTION_CLOSED') || zonesStore.error.includes('fetch')) {
      zonesStore.setError('Cannot connect to backend server. Make sure the backend is running at ' + BACKEND_URL)
    }
  }

  if (success) {
    successMessage.value = 'Zone request submitted successfully!'
    setTimeout(() => {
      router.push('/requests')
    }, 2000)
  }
}

</script>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--gray-50);
}

/* Main Content */
.main-content {
  padding: var(--spacing-xl) 0;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--gray-200);
}

/* Info Box */
.info-box {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--info);
  background: rgba(66, 153, 225, 0.1);
  border: 1px solid rgba(66, 153, 225, 0.3);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
}

.info-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.info-text {
  font-size: 14px;
  color: var(--gray-700);
  line-height: 1.5;
}

.form-hint {
  font-size: 13px;
  color: var(--gray-500);
  margin-top: var(--spacing-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
