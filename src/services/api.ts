import axios from 'axios'
import { getAuthToken } from './firebase'
import type { Zone, SatelliteImage, ZoneRequest, UserTier } from '@/types'

const BACKEND_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000')

export { BACKEND_URL }

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
})

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

async function ensureCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken
  try {
    await fetch('/api/v1/tiers', { method: 'GET', credentials: 'same-origin' })
  } catch {
    // fall through
  }
  csrfToken = readCsrfCookie()
  return csrfToken
}

let csrfToken: string | null = readCsrfCookie()

api.interceptors.response.use((response) => {
  const token = readCsrfCookie()
  if (token) csrfToken = token
  return response
})

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const token = await ensureCsrfToken()
    if (token) config.headers[CSRF_HEADER_NAME] = token
  }
  return config
})

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = String(error.response?.status ?? error.message ?? 'unknown').replace(/[\r\n]/g, ' ')
    console.error('API Error:', msg)
    return Promise.reject(error)
  }
)

export const apiService = {
  health: async () => {
    const response = await api.get('/health')
    return response.data
  },

  getUserZones: async (userId: string): Promise<Zone[]> => {
    try {
      const response = await api.get('/api/v1/zones', { params: { user_id: userId } })
      return response.data.data || []
    } catch {
      return []
    }
  },

  getZone: async (zoneId: string): Promise<Zone | null> => {
    try {
      const response = await api.get(`/api/v1/zones/${zoneId}`)
      return response.data.data
    } catch {
      return null
    }
  },

  getZoneImages: async (zoneId: string): Promise<SatelliteImage[]> => {
    try {
      const response = await api.get(`/api/v1/zones/${zoneId}/images`)
      return response.data.data || []
    } catch {
      return []
    }
  },

  requestZone: async (data: {
    user_id: string
    zone_name?: string
    coordinates: { latitude: number; longitude: number; altitude: number }
    zone_area?: { size_feet: number }
    quality: string
    notes?: string
  }) => {
    const response = await api.post('/api/v1/user/request-zone', data)
    return response.data
  },

  getUserRequests: async (userId: string): Promise<ZoneRequest[]> => {
    try {
      const response = await api.get(`/api/v1/user/requests/${userId}`)
      return response.data.data || []
    } catch {
      return []
    }
  },

  registerUser: async (profile: { email?: string; display_name?: string; tier_id?: string }) => {
    try {
      const response = await api.post('/api/v1/user/register', profile)
      return response.data
    } catch (error) {
      console.error('Error registering user profile:', error)
      return null
    }
  },

  getUserTier: async (userId: string): Promise<UserTier> => {
    try {
      const response = await api.get(`/api/v1/users/${userId}/tier`)
      return response.data.data
    } catch {
      return {
        tier_id: 'free',
        tier_name: 'Free',
        tier_level: 'free',
        zones_limit: 1,
        images_per_month: 10,
        automation_enabled: false,
        priority: 'low'
      }
    }
  },

  analyzeZone: async (data: {
    zone_id?: string
    lat?: number
    lon?: number
    polygon?: [number, number][]
    version?: 'v1' | 'v2'
    tier?: string
    user_id?: string
    modules?: string[]
    time?: string
    params?: Record<string, any>
  }) => {
    const response = await api.post('/api/v1/delivery/analyze', data)
    return response.data
  },

  listAnalyses: async (limit = 50) => {
    const response = await api.get('/api/v1/delivery/analyses', { params: { limit } })
    return response.data
  },

  getAnalysis: async (id: string) => {
    const response = await api.get(`/api/v1/delivery/analyses/${id}`)
    return response.data
  },

  getDeliveredVersion: async (zoneId: string, version: 'v1' | 'v2') => {
    try {
      const response = await api.get(`/api/v1/zones/${zoneId}/versions/${version}`)
      return response.data.data || null
    } catch {
      return null
    }
  },

  getDeliveredVersions: async (zoneId: string) => {
    try {
      const response = await api.get(`/api/v1/zones/${zoneId}/deliveries`)
      return response.data.data || []
    } catch {
      return []
    }
  },

  getUserDeliveries: async (userId: string) => {
    try {
      const response = await api.get(`/api/v1/users/${userId}/deliveries`)
      return response.data.data || []
    } catch {
      return []
    }
  },

  getDeliveredByModule: async (zoneId: string, module: string) => {
    try {
      const response = await api.get(`/api/v1/delivery/zones/${zoneId}/modules/${module}`)
      return response.data.data || null
    } catch {
      return null
    }
  },

  triggerTask: async (data: {
    zone_id: string
    modules: string[]
    requirement: { aoi_version: 'v1' | 'v2'; output_type: string; resolution: string; provider?: string; time?: string }
    force_refresh?: boolean
  }) => {
    const response = await api.post('/api/v1/user/trigger-task', data)
    return response.data
  },

  requestZoneV2: async (
    v1: { lat: number; lon: number } | null,
    v2: { coordinates: [number, number][] } | null
  ) => {
    const response = await api.post('/api/v1/user/request-zone', { v1, v2 })
    return response.data
  },
}

export default api
