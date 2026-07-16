import axios from 'axios'
import { getAuthToken } from './firebase'
import type { Zone, SatelliteImage, ZoneRequest, UserTier } from '@/types'

// In dev, ALWAYS route through the Vite proxy (relative base) so the backend's
// CSRF cookie is set on the same origin and stays readable by the browser.
// This also avoids an absolute cross-origin URL (which breaks the CSRF
// double-submit cookie). In production builds, use the configured backend URL.
const BACKEND_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000')

export { BACKEND_URL }

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
})

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

// Ensure we have a CSRF token before sending a mutating request. On a fresh page
// load the backend may not have issued the cookie yet (it's set on responses), so
// we warm it up with a public GET. We use fetch() directly to avoid recursing
// through this axios instance's own request interceptors.
async function ensureCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken
  try {
    await fetch('/api/v1/tiers', { method: 'GET', credentials: 'same-origin' })
  } catch {
    // endpoint may be unavailable; fall through and use whatever cookie exists
  }
  csrfToken = readCsrfCookie()
  return csrfToken
}

// Capture the CSRF token the backend issues and replay it on mutating requests.
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

let csrfToken: string | null = readCsrfCookie()

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// API service methods
export const apiService = {
  // Health check
  health: async () => {
    const response = await api.get('/health')
    return response.data
  },

  // Get user's zones
  getUserZones: async (userId: string): Promise<Zone[]> => {
    try {
      // This endpoint should filter zones by user_id
      const response = await api.get('/api/v1/zones', {
        params: { user_id: userId }
      })
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching zones:', error)
      return []
    }
  },

  // Get zone details
  getZone: async (zoneId: string): Promise<Zone | null> => {
    try {
      const response = await api.get(`/api/v1/zones/${zoneId}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching zone:', error)
      return null
    }
  },

  // Get zone images
  getZoneImages: async (zoneId: string): Promise<SatelliteImage[]> => {
    try {
      const response = await api.get(`/api/v1/zones/${zoneId}/images`)
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching images:', error)
      return []
    }
  },

  // Request new zone
  requestZone: async (data: {
    user_id: string
    coordinates: { latitude: number; longitude: number; altitude: number }
    zone_area?: { size_feet: number }
    quality: string
    notes?: string
  }) => {
    const response = await api.post('/api/v1/user/request-zone', data)
    return response.data
  },

  // Get user's zone requests
  getUserRequests: async (userId: string): Promise<ZoneRequest[]> => {
    try {
      const response = await api.get(`/api/v1/user/requests/${userId}`)
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching requests:', error)
      return []
    }
  },

  // Register the P2 user profile in the backend after Firebase Auth signup.
  registerUser: async (profile: { email?: string; display_name?: string; tier_id?: string }) => {
    try {
      const response = await api.post('/api/v1/user/register', profile)
      return response.data
    } catch (error) {
      // Profile creation is best-effort; don't block signup on failure.
      console.error('Error registering user profile:', error)
      return null
    }
},

  // Get user tier
  getUserTier: async (userId: string): Promise<UserTier> => {
    try {
      const response = await api.get(`/api/v1/users/${userId}/tier`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching tier:', error)
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

  // ===== Prototype analysis flow (publishing delivery layer -> admin-backend) =====
  // No ImageKit/Supabase: results are served from the admin-backend store.
  analyzeZone: async (data: {
    zone_id?: string
    lat?: number
    lon?: number
    polygon?: [number, number][]   // v2: drawn border (3+ points [lon,lat])
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

  // ===== Delivered user data (admin pushes -> pullpush -> Firebase P2 Firestore) =====
  // v1 (point) and v2 (border) are SEPARATE AOIs.
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
  }
}
export default api
