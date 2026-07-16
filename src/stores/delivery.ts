import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/services/firebase'
import { collection, doc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import type { DeliveredData } from '@/types'

// One listener per zone_id. Cleaned up on zone change or logout.
const SUPPORTED_MODULES = ['optical', 'weather', 'elevation', 'radar', 'land-cover', 'hydrology', 'spectral'] as const
export type ModuleName = typeof SUPPORTED_MODULES[number]

export const useDeliveryStore = defineStore('delivery', () => {
  // Map of module -> DeliveredData for the currently watched zone
  const deliveries = ref<Partial<Record<ModuleName, DeliveredData>>>({})
  const activeZoneId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Active Firestore unsubscribe handles — one per module
  const _unsubs = ref<Unsubscribe[]>([])

  function _clearListeners() {
    _unsubs.value.forEach(u => u())
    _unsubs.value = []
  }

  /**
   * Subscribe to all module delivery docs for a zone.
   * Replaces any existing subscription.
   */
  function watchZone(zoneId: string) {
    if (activeZoneId.value === zoneId) return
    _clearListeners()
    deliveries.value = {}
    activeZoneId.value = zoneId

    if (!db) {
      error.value = 'Firestore not configured'
      return
    }

    loading.value = true

    for (const module of SUPPORTED_MODULES) {
      const docId = `${zoneId}_${module}`
      const unsub = onSnapshot(
        doc(db, 'delivered_data', docId),
        (snap) => {
          loading.value = false
          if (snap.exists()) {
            deliveries.value = {
              ...deliveries.value,
              [module]: snap.data() as DeliveredData,
            }
          }
        },
        (err) => {
          loading.value = false
          error.value = err.message
        }
      )
      _unsubs.value.push(unsub)
    }
  }

  /** Stop all listeners and reset state. Call on logout or leaving zone page. */
  function stopWatching() {
    _clearListeners()
    deliveries.value = {}
    activeZoneId.value = null
    loading.value = false
    error.value = null
  }

  function getModule(module: ModuleName): DeliveredData | undefined {
    return deliveries.value[module]
  }

  return {
    deliveries,
    activeZoneId,
    loading,
    error,
    watchZone,
    stopWatching,
    getModule,
  }
})
