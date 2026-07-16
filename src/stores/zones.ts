import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { Zone, SatelliteImage, ZoneRequest } from '@/types'

export const useZonesStore = defineStore('zones', () => {
  const zones = ref<Zone[]>([])
  const currentZone = ref<Zone | null>(null)
  const zoneImages = ref<SatelliteImage[]>([])
  const userRequests = ref<ZoneRequest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadUserZones(userId: string) {
    loading.value = true
    error.value = null
    try {
      zones.value = await apiService.getUserZones(userId)
    } catch (err: any) {
      console.error('Load zones error:', err)
      error.value = err.message || 'Failed to load zones'
    } finally {
      loading.value = false
    }
  }

  async function loadZone(zoneId: string) {
    loading.value = true
    error.value = null
    try {
      currentZone.value = await apiService.getZone(zoneId)
    } catch (err: any) {
      console.error('Load zone error:', err)
      error.value = err.message || 'Failed to load zone'
    } finally {
      loading.value = false
    }
  }

  async function loadZoneImages(zoneId: string) {
    loading.value = true
    error.value = null
    try {
      zoneImages.value = await apiService.getZoneImages(zoneId)
    } catch (err: any) {
      console.error('Load images error:', err)
      error.value = err.message || 'Failed to load images'
    } finally {
      loading.value = false
    }
  }

  async function loadUserRequests(userId: string) {
    loading.value = true
    error.value = null
    try {
      userRequests.value = await apiService.getUserRequests(userId)
    } catch (err: any) {
      console.error('Load requests error:', err)
      error.value = err.message || 'Failed to load requests'
    } finally {
      loading.value = false
    }
  }

  async function requestNewZone(data: {
    user_id: string
    zone_name?: string
    coordinates: { latitude: number; longitude: number; altitude: number }
    zone_area?: { size_feet: number }
    quality: string
    notes?: string
  }) {
    loading.value = true
    error.value = null
    try {
      await apiService.requestZone(data)
      await loadUserRequests(data.user_id)
      return true
    } catch (err: any) {
      console.error('Request zone error:', err)
      const message = err.message || 'Failed to submit zone request'
      if (message.includes('Network Error') || message.includes('ERR_CONNECTION_CLOSED') || message.toLowerCase().includes('fetch')) {
        error.value = 'Cannot connect to backend server. Please ensure the backend is running.'
      } else {
        error.value = message
      }
      return false
    } finally {
      loading.value = false
    }
  }

  async function requestZoneV2(v1: { lat: number; lon: number } | null, v2: { coordinates: [number, number][] } | null, quality = 'high') {
    loading.value = true
    error.value = null
    try {
      const response = await apiService.requestZoneV2(v1, v2, quality)
      return response
    } catch (err: any) {
      error.value = err?.response?.data?.detail || err?.message || 'Failed to submit zone'
      return null
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function setError(msg: string) {
    error.value = msg
  }

  return {
    zones,
    currentZone,
    zoneImages,
    userRequests,
    loading,
    error,
    loadUserZones,
    loadZone,
    loadZoneImages,
    loadUserRequests,
    requestNewZone,
    requestZoneV2,
    clearError,
    setError
  }
})
