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
      <div class="container">
        <div class="section-header">
          <h2 class="page-title">Analysis Results</h2>
          <router-link to="/analyze" class="btn btn-primary btn-sm">+ New Analysis</router-link>
        </div>

        <div v-if="loading" class="empty-state"><p class="empty-text">Loading…</p></div>
        <div v-else-if="!list.length" class="empty-state">
          <div class="empty-icon">🛰️</div>
          <div class="empty-title">No analyses yet</div>
          <p class="empty-text">Run your first analysis to see results here.</p>
          <router-link to="/analyze" class="btn btn-primary mt-md">New Analysis</router-link>
        </div>

        <div v-else class="grid grid-2">
          <div v-for="a in list" :key="a.id" class="card">
            <div class="card-header">
              <h3 class="card-title">{{ a.zone_id }}
                <span class="badge" :class="badgeClass(a.status)">{{ a.status }}</span>
              </h3>
              <p class="card-subtitle">{{ fmt(a.created_at) }} · {{ modulesOf(a) }}</p>
            </div>
            <button class="btn btn-secondary btn-sm" @click="open(a.id)">View detail</button>

            <div v-if="openId === a.id && detail" class="mt-md">
              <div v-for="r in detail.results" :key="r.module" class="result-block">
                <div class="result-head">
                  <strong>{{ r.module }}</strong>
                  <span class="badge" :class="badgeClass(r.status)">{{ r.status }}</span>
                  <span v-if="r.provider" class="text-muted">· {{ r.provider }}</span>
                </div>
                <pre class="result-json">{{ pretty(r.output) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const list = ref<any[]>([])
const loading = ref(true)
const openId = ref('')
const detail = ref<any>(null)

function badgeClass(status: string) {
  return status === 'success' ? 'badge-success'
    : status === 'partial' ? 'badge-warning' : 'badge-error'
}
function modulesOf(a: any) {
  try { return (JSON.parse(a.modules) as string[]).join(', ') } catch { return a.modules }
}
function fmt(v: any) {
  if (!v) return '—'
  return new Date(v).toLocaleString()
}
function pretty(o: any) {
  try { return JSON.stringify(o, null, 2) } catch { return String(o) }
}

async function open(id: string) {
  if (openId.value === id) { openId.value = ''; detail.value = null; return }
  openId.value = id
  try { detail.value = await apiService.getAnalysis(id) } catch (e) { detail.value = null }
}

onMounted(async () => {
  try {
    const res = await apiService.listAnalyses(50)
    list.value = res.data || []
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
})

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.result-block { border-top: 1px solid var(--gray-100); padding: 12px 0; }
.result-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.result-json {
  background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: var(--radius-md);
  font-size: 12px; overflow: auto; max-height: 320px;
}
.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef9c3; color: #854d0e; }
.badge-error { background: #fee2e2; color: #991b1b; }
</style>
