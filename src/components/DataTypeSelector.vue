<template>
  <div class="module-tabs">
    <button
      v-for="m in modules"
      :key="m.key"
      class="module-tab"
      :class="{ active: modelValue === m.key, 'has-data': m.hasData, pending: m.isPending }"
      @click="$emit('update:modelValue', m.key)"
    >
      <span class="tab-icon">{{ m.icon }}</span>
      <span class="tab-label">{{ m.label }}</span>
      <span v-if="m.isPending" class="tab-dot pending-dot" title="Processing…" />
      <span v-else-if="m.hasData" class="tab-dot ready-dot" title="Data ready" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DeliveredData } from '@/types'
import type { ModuleName } from '@/stores/delivery'

const props = defineProps<{
  modelValue: ModuleName
  deliveries: Partial<Record<ModuleName, DeliveredData>>
}>()

defineEmits<{ (e: 'update:modelValue', v: ModuleName): void }>()

const MODULE_META: Record<ModuleName, { label: string; icon: string }> = {
  optical:    { label: 'Optical',    icon: '🛰️' },
  weather:    { label: 'Weather',    icon: '🌤️' },
  elevation:  { label: 'Elevation',  icon: '⛰️' },
  radar:      { label: 'Radar',      icon: '📡' },
  'land-cover': { label: 'Land Cover', icon: '🌿' },
  hydrology:  { label: 'Hydrology',  icon: '💧' },
  spectral:   { label: 'Spectral',   icon: '🔬' },
}

const modules = computed(() =>
  (Object.keys(MODULE_META) as ModuleName[]).map((key) => {
    const d = props.deliveries[key]
    return {
      key,
      ...MODULE_META[key],
      hasData: !!d && ['complete', 'partial', 'permanently_adjusted'].includes(d.status),
      isPending: !!d && d.status === 'pending',
    }
  })
)
</script>

<style scoped>
.module-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 16px 20px 0;
  border-bottom: 1px solid var(--gray-200, #e5e7eb);
}

.module-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--gray-200, #e5e7eb);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  background: var(--gray-50, #f9fafb);
  color: var(--gray-500, #6b7280);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}

.module-tab:hover {
  background: white;
  color: var(--gray-800, #1f2937);
}

.module-tab.active {
  background: white;
  color: var(--primary, #2563eb);
  border-color: var(--gray-200, #e5e7eb);
  border-bottom-color: white;
  margin-bottom: -1px;
  z-index: 1;
}

.tab-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.ready-dot  { background: #22c55e; }
.pending-dot { background: #f59e0b; animation: pulse 1.5s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
</style>
