<template>
  <div class="delivery-card" :class="variant">
    <div class="card-head">
      <div class="card-label">
        <span class="label-badge" :class="variant">{{ variant === 'requirement' ? 'Requested' : 'Delivered' }}</span>
        <span v-if="spec.provider" class="provider-tag">{{ spec.provider }}</span>
      </div>
      <div v-if="qualityScore != null" class="quality-pill" :class="qualityClass">
        {{ ((qualityScore ?? 0) * 100).toFixed(0) }}% quality
      </div>
    </div>

    <!-- Images (ImageKit URLs) -->
    <div v-if="imageUrls.length" class="images-grid">
      <div
        v-for="(url, i) in imageUrls"
        :key="i"
        class="img-wrap"
        @click="openModal(url)"
      >
        <img :src="url" alt="satellite imagery" class="thumb" loading="lazy" />
        <div class="img-overlay">🔍</div>
      </div>
    </div>

    <!-- Tile URLs (GIBS / WMTS — render as map tiles) -->
    <div v-else-if="tileUrls.length" class="tile-list">
      <div class="tile-note">🗺️ {{ tileUrls.length }} map tile{{ tileUrls.length !== 1 ? 's' : '' }} — click to preview</div>
      <div class="images-grid">
        <div
          v-for="(url, i) in tileUrls.slice(0, 9)"
          :key="i"
          class="img-wrap"
          @click="openModal(url)"
        >
          <img :src="url" alt="map tile" class="thumb" loading="lazy" />
          <div class="img-overlay">🔍</div>
        </div>
      </div>
      <div v-if="tileUrls.length > 9" class="tile-more">+{{ tileUrls.length - 9 }} more tiles</div>
    </div>

    <!-- Structured data (weather, elevation, hydrology, spectral, land-cover) -->
    <div v-else-if="hasStructuredData" class="data-section">
      <div
        v-for="(val, key) in flatData"
        :key="key"
        class="data-row"
      >
        <span class="data-key">{{ formatKey(String(key)) }}</span>
        <span class="data-val">{{ formatVal(val) }}</span>
      </div>
    </div>

    <!-- No content -->
    <div v-else class="no-images">
      <span>{{ statusLabel }}</span>
    </div>

    <!-- Meta row -->
    <div class="meta-row">
      <span v-if="spec.resolution" class="meta-item">📐 {{ spec.resolution }}</span>
      <span class="meta-item">📅 {{ spec.captured_at ? fmtDate(spec.captured_at) : '—' }}</span>
      <span v-if="spec.aoi_version" class="meta-item">🗺️ {{ spec.aoi_version.toUpperCase() }}</span>
      <span v-if="spec.coverage_pct" class="meta-item">📊 {{ spec.coverage_pct }}% coverage</span>
      <span v-if="spec.output_type" class="meta-item">📦 {{ spec.output_type }}</span>
    </div>

    <div v-if="spec.adjustment_reason" class="adjustment-note">
      ⚠️ {{ spec.adjustment_reason }}
    </div>

    <!-- Image modal -->
    <teleport to="body">
      <div v-if="modalUrl" class="modal-overlay" @click="modalUrl = null">
        <div class="modal-box" @click.stop>
          <button class="modal-close" @click="modalUrl = null">✕</button>
          <img :src="modalUrl" class="modal-img" alt="full size" />
          <a :href="modalUrl" target="_blank" class="btn-download">⬇ Download</a>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DeliverySpec } from '@/types'

const props = defineProps<{
  spec: DeliverySpec
  variant: 'requirement' | 'availability'
  qualityScore?: number | null
  status?: string
}>()

const modalUrl = ref<string | null>(null)

// ImageKit / direct image URLs
const imageUrls = computed(() => props.spec.image_urls?.filter(u => u) ?? [])

// Tile URLs from spec.data.items (GIBS TileRef objects)
const tileUrls = computed(() => {
  const items: any[] = props.spec.data?.items ?? []
  return items
    .filter((it: any) => it?.kind === 'tile' || it?.url)
    .map((it: any) => it.url)
    .filter(Boolean)
})

// Flatten structured data for display (skip items/image arrays)
const SKIP_KEYS = new Set(['items', 'image_urls', 'bytes', 'provider', 'source', 'status', 'note', 'future_providers'])

const flatData = computed(() => {
  const d = props.spec.data ?? {}
  const out: Record<string, any> = {}
  function flatten(obj: any, prefix = '') {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return
    for (const [k, v] of Object.entries(obj)) {
      if (SKIP_KEYS.has(k)) continue
      const fullKey = prefix ? `${prefix}.${k}` : k
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        flatten(v, fullKey)
      } else if (v !== null && v !== undefined) {
        out[fullKey] = v
      }
    }
  }
  flatten(d)
  return out
})

const hasStructuredData = computed(() => Object.keys(flatData.value).length > 0)

const statusLabel = computed(() => {
  if (props.status === 'pending') return '⏳ Processing…'
  if (props.status === 'partial') return '⚠️ Partial data — best available imagery shown'
  return '📭 No data available'
})

const qualityClass = computed(() => {
  const s = props.qualityScore ?? 0
  if (s >= 0.75) return 'high'
  if (s >= 0.5)  return 'medium'
  return 'low'
})

function openModal(url: string) { modalUrl.value = url }

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return d }
}

function formatKey(k: string): string {
  return k.replace(/_/g, ' ').replace(/\./g, ' › ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatVal(v: any): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(4)
  if (Array.isArray(v)) return v.join(', ')
  return String(v)
}
</script>

<style scoped>
.delivery-card {
  border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.delivery-card.availability {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--gray-100, #f3f4f6);
}

.card-label { display: flex; align-items: center; gap: 8px; }

.label-badge {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 3px 8px; border-radius: 4px;
}
.label-badge.requirement { background: #f3f4f6; color: #374151; }
.label-badge.availability { background: #dbeafe; color: #1d4ed8; }

.provider-tag { font-size: 12px; color: var(--gray-500, #6b7280); }

.quality-pill { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
.quality-pill.high   { background: #dcfce7; color: #15803d; }
.quality-pill.medium { background: #fef9c3; color: #a16207; }
.quality-pill.low    { background: #fee2e2; color: #b91c1c; }

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 6px;
  padding: 10px;
}

.img-wrap {
  position: relative; aspect-ratio: 1;
  border-radius: 6px; overflow: hidden;
  cursor: pointer; background: var(--gray-100, #f3f4f6);
}
.thumb { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; }
.img-wrap:hover .thumb { transform: scale(1.05); }
.img-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; opacity: 0; transition: opacity 0.2s;
}
.img-wrap:hover .img-overlay { opacity: 1; }

.tile-list { padding: 10px 10px 0; }
.tile-note { font-size: 12px; color: var(--gray-500, #6b7280); margin-bottom: 6px; }
.tile-more { font-size: 12px; color: var(--gray-400, #9ca3af); padding: 4px 10px 10px; }

/* Structured data table */
.data-section { padding: 8px 0; max-height: 320px; overflow-y: auto; }
.data-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 5px 16px; gap: 12px;
  border-bottom: 1px solid var(--gray-50, #f9fafb);
}
.data-row:last-child { border-bottom: none; }
.data-key { font-size: 12px; color: var(--gray-500, #6b7280); flex-shrink: 0; }
.data-val { font-size: 13px; font-weight: 600; color: var(--gray-800, #1f2937); text-align: right; word-break: break-all; }

.no-images { padding: 32px; text-align: center; color: var(--gray-400, #9ca3af); font-size: 14px; }

.meta-row {
  display: flex; flex-wrap: wrap; gap: 10px;
  padding: 8px 16px;
  border-top: 1px solid var(--gray-100, #f3f4f6);
  font-size: 12px; color: var(--gray-500, #6b7280);
}

.adjustment-note {
  padding: 8px 16px; background: #fffbeb;
  border-top: 1px solid #fde68a; font-size: 12px; color: #92400e;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 20px;
}
.modal-box {
  position: relative; max-width: 90vw; max-height: 90vh;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.modal-close {
  position: absolute; top: -36px; right: 0;
  background: rgba(255,255,255,0.2); border: none; color: white;
  font-size: 20px; width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
}
.modal-img { max-width: 100%; max-height: calc(90vh - 80px); object-fit: contain; border-radius: 8px; }
.btn-download {
  color: white; background: rgba(255,255,255,0.15);
  padding: 8px 20px; border-radius: 8px; text-decoration: none; font-size: 13px;
}
</style>
