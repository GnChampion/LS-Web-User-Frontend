<template>
  <div class="compare-wrapper">
    <!-- Pending state -->
    <div v-if="data.status === 'pending'" class="status-banner pending">
      <span class="spinner" />
      Processing… satellite data is being collected for {{ moduleLabel }}
    </div>

    <!-- Stub module notice -->
    <div v-if="isStubModule && data.status !== 'pending'" class="status-banner stub">
      🔬 {{ moduleLabel }} uses a prototype provider — real data requires Group B credentials (see note in results)
    </div>

    <!-- Complete: single card -->
    <div v-if="data.status === 'complete' && data.delivery_1" class="single-card">
      <DeliveryCard
        :spec="data.delivery_1"
        variant="requirement"
        :quality-score="data.quality_score"
        :status="data.status"
      />
    </div>

    <!-- Partial: two-card compare -->
    <div v-else-if="(data.status === 'partial' || data.status === 'permanently_adjusted') && data.delivery_1" class="two-col">
      <div class="col-wrap">
        <p class="col-title">What was requested</p>
        <DeliveryCard
          :spec="data.delivery_1"
          variant="requirement"
          :status="data.status"
        />
      </div>
      <div class="col-divider">
        <span class="divider-label">vs</span>
      </div>
      <div class="col-wrap">
        <p class="col-title">What was delivered</p>
        <DeliveryCard
          v-if="data.delivery_2"
          :spec="data.delivery_2"
          variant="availability"
          :quality-score="data.quality_score"
          :status="data.status"
        />
        <div v-else class="no-delivery-2">
          <span>Availability data not yet available</span>
        </div>
      </div>
    </div>

    <!-- Status banners -->
    <div v-if="data.status === 'permanently_adjusted'" class="status-banner adjusted">
      ⚠️ Best available data — no further improvement expected after {{ data.attempt_number }} attempt{{ data.attempt_number !== 1 ? 's' : '' }}
    </div>
    <div v-else-if="data.status === 'partial'" class="status-banner retry">
      🔄 Better data is being sought — retry scheduled automatically
    </div>

    <!-- Attempt / task info -->
    <div class="meta-footer">
      <span v-if="data.attempt_number > 1">Attempt {{ data.attempt_number }}</span>
      <span v-if="data.updated_at">Updated {{ fmtDate(data.updated_at) }}</span>
      <span v-if="data.task_id" class="task-id" :title="data.task_id">Task: {{ data.task_id.slice(0, 16) }}…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DeliveryCard from './DeliveryCard.vue'
import type { DeliveredData } from '@/types'

const props = defineProps<{
  data: DeliveredData
  module?: string
}>()

const STUB_MODULES = new Set(['elevation', 'radar', 'spectral', 'land-cover'])

const MODULE_LABELS: Record<string, string> = {
  optical: 'Optical', weather: 'Weather', elevation: 'Elevation',
  radar: 'Radar', 'land-cover': 'Land Cover', hydrology: 'Hydrology', spectral: 'Spectral',
}

const moduleLabel = computed(() => MODULE_LABELS[props.module ?? props.data.module] ?? props.data.module)
const isStubModule = computed(() => STUB_MODULES.has(props.module ?? props.data.module))

function fmtDate(d: any): string {
  if (!d) return ''
  try {
    const ts = d?.seconds ? new Date(d.seconds * 1000) : new Date(d)
    return ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}
</script>

<style scoped>
.compare-wrapper { display: flex; flex-direction: column; gap: 12px; }

.two-col {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: start;
}

.col-wrap { min-width: 0; }
.col-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--gray-400, #9ca3af); margin: 0 0 8px 4px;
}

.col-divider {
  display: flex; align-items: center; justify-content: center;
  padding: 0 12px; padding-top: 28px;
}
.divider-label {
  font-size: 12px; font-weight: 700; color: var(--gray-400, #9ca3af);
  background: var(--gray-100, #f3f4f6); padding: 4px 8px; border-radius: 20px;
}

.status-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
}
.status-banner.pending  { background: #fef9c3; color: #92400e; }
.status-banner.retry    { background: #eff6ff; color: #1d4ed8; }
.status-banner.adjusted { background: #fff7ed; color: #9a3412; }
.status-banner.stub     { background: #f5f3ff; color: #6d28d9; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid #fde68a; border-top-color: #d97706;
  border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.no-delivery-2 {
  padding: 32px; text-align: center;
  color: var(--gray-400, #9ca3af); font-size: 13px;
  border: 1px dashed var(--gray-200, #e5e7eb); border-radius: 12px;
}

.meta-footer {
  display: flex; gap: 16px; flex-wrap: wrap;
  font-size: 11px; color: var(--gray-400, #9ca3af);
  padding: 4px 2px;
}
.task-id { font-family: monospace; }

@media (max-width: 640px) {
  .two-col { grid-template-columns: 1fr; }
  .col-divider { padding: 8px 0; }
}
</style>
