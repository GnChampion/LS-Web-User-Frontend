<template>
  <div class="page">
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="header-brand">
            <h1 class="brand-title">🛰️ Land Scanner</h1>
          </div>
          <nav class="header-nav">
            <router-link to="/" class="nav-link">Dashboard</router-link>
            <router-link to="/analyze" class="nav-link">Analyze</router-link>
            <router-link to="/analyses" class="nav-link">Results</router-link>
            <router-link to="/profile" class="nav-link">Profile</router-link>
            <button @click="handleLogout" class="btn btn-secondary btn-sm">Logout</button>
          </nav>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="container-sm">
        <h2 class="page-title">New Analysis</h2>
        <p class="page-subtitle">Pick a location and the data modules to run. The request is sent to the
          delivery service, which orchestrates the automation modules and stores the results.</p>

        <div class="card">
          <div v-if="error" class="alert alert-error">{{ error }}</div>

          <form @submit.prevent="runAnalysis">
            <div class="grid grid-2">
              <div class="form-group">
                <label class="form-label">Latitude</label>
                <input v-model="lat" type="number" step="0.0001" class="form-input" required />
              </div>
              <div class="form-group">
                <label class="form-label">Longitude</label>
                <input v-model="lon" type="number" step="0.0001" class="form-input" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Data modules</label>
              <div class="module-grid">
                <label v-for="m in ALL_MODULES" :key="m" class="module-chip">
                  <input type="checkbox" :value="m" v-model="selected" />
                  <span>{{ m }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Time (optional, YYYY-MM-DD)</label>
              <input v-model="time" type="text" class="form-input" placeholder="leave blank for latest" />
            </div>

            <div class="form-group" v-if="selected.includes('hydrology')">
              <label class="form-label">Hydrology site_id (optional, e.g. 01646500)</label>
              <input v-model="siteId" type="text" class="form-input" placeholder="nearest US gage if blank" />
            </div>

            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Running…' : 'Run Analysis' }}
            </button>
          </form>
        </div>

        <div v-if="result" class="card mt-lg">
          <div class="card-header">
            <h3 class="card-title">Analysis {{ result.id.slice(0, 10) }}
              <span class="badge" :class="badgeClass(result.status)">{{ result.status }}</span>
            </h3>
            <p class="card-subtitle">zone {{ result.zone_id }} · {{ result.results.length }} modules</p>
          </div>

          <div v-for="r in result.results" :key="r.module" class="result-block">
            <div class="result-head">
              <strong>{{ r.module }}</strong>
              <span class="badge" :class="badgeClass(r.status)">{{ r.status }}</span>
              <span v-if="r.provider" class="text-muted">· {{ r.provider }}</span>
            </div>
            <pre class="result-json">{{ pretty(r.output) }}</pre>
            <div v-if="r.error" class="alert alert-error mt-sm">{{ r.error }}</div>
          </div>

          <router-link to="/analyses" class="btn btn-secondary mt-md">View all results →</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const ALL_MODULES = ['optical', 'spectral', 'elevation', 'radar', 'land-cover', 'weather', 'hydrology']
const lat = ref('13.0827')
const lon = ref('80.2707')
const time = ref('')
const siteId = ref('')
const selected = ref(['optical'])
const loading = ref(false)
const error = ref('')
const result = ref<any>(null)

function badgeClass(status: string) {
  return status === 'success' ? 'badge-success'
    : status === 'partial' ? 'badge-warning'
    : 'badge-error'
}
function pretty(o: any) {
  try { return JSON.stringify(o, null, 2) } catch { return String(o) }
}

async function runAnalysis() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const params: Record<string, any> = {}
    if (selected.value.includes('hydrology') && siteId.value) {
      params['hydrology'] = { site_id: siteId.value }
    }
    const data = await apiService.analyzeZone({
      lat: parseFloat(lat.value),
      lon: parseFloat(lon.value),
      modules: selected.value,
      time: time.value || undefined,
      params
    })
    result.value = data
  } catch (e: any) {
    error.value = e?.response?.data?.detail || e.message || 'Analysis failed'
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.module-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
}
.result-block {
  border-top: 1px solid var(--gray-100);
  padding: 12px 0;
}
.result-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.result-json {
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
  overflow: auto;
  max-height: 320px;
}
.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef9c3; color: #854d0e; }
.badge-error { background: #fee2e2; color: #991b1b; }
</style>
