// Type definitions for the application

export interface User {
  uid: string
  email: string | null
  displayName?: string | null
}

export interface UserTier {
  tier_id: string
  tier_name: string
  tier_level: 'free' | 'standard' | 'pro' | 'enterprise'
  zones_limit: number
  images_per_month: number
  automation_enabled: boolean
  priority: string
}

export interface Coordinates {
  latitude: number
  longitude: number
  altitude: number
}

// A zone stores BOTH a v1 point (xy) and an optional v2 border (Nxy).
export interface Zone {
  zone_id: string
  zone_name: string
  coordinates: Coordinates
  area_size_feet: number
  quality: 'low' | 'medium' | 'high' | 'ultra'
  status: string
  created_at?: any
  user_id?: string
  xy?: { lat: number; lon: number }        // v1 — ALWAYS present (pointed zone)
  borders?: Record<string, [number, number][]>  // v2 — drawn borders keyed by point count (e.g. "3xy")
  has_v1?: boolean
  has_v2?: boolean
  tier_id?: string
}

export interface SatelliteImage {
  image_id: string
  image_url: string
  provider: string
  quality: string
  resolution: string
  captured_at: string
  area_covered_sqft?: number
  created_at?: string
}

export interface ZoneRequest {
  request_id: string
  user_id: string
  coordinates: Coordinates
  zone_area?: {
    size_feet: number
  }
  quality: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  created_at: string
  zone_id?: string
}

// Admin-generated, tier-limited extract pushed to Firebase P2 (user DB).
// v1 and v2 are stored SEPARATELY, keyed by (zone_id, version).
export interface DeliveredVersion {
  version: 'v1' | 'v2'
  tier: string
  user_id?: string | null
  analysis_id?: string
  status: string
  modules: string[]
  image_urls: string[]
  data: Record<string, any>
  updated_at?: any
}

export interface DeliveredZone {
  zone_id: string
  user_id?: string | null
  has_v1?: boolean
  has_v2?: boolean
  tier_id?: string
  status?: string
  updated_at?: any
  versions?: DeliveredVersion[]
}
