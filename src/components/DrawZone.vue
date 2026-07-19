<template>
  <div class="draw-zone">
    <div ref="mapContainer" class="leaflet-map" :style="{ height: height }"></div>
    <div class="draw-toolbar">
      <span class="draw-hint">
        <template v-if="version === 'v1'">Click the map to place your point.</template>
        <template v-else>Click the map to add polygon points (min 3). Close the shape when done.</template>
      </span>
      <div class="draw-actions" v-if="version === 'v2'">
        <button type="button" class="btn btn-sm btn-secondary" :disabled="points.length === 0" @click="undo">↩ Undo</button>
        <button type="button" class="btn btn-sm btn-secondary" :disabled="points.length === 0" @click="clear">✕ Clear</button>
        <span v-if="points.length > 0" class="draw-count">{{ points.length }} pts</span>
      </div>
      <div class="draw-actions" v-else>
        <button type="button" class="btn btn-sm btn-secondary" :disabled="!hasPoint" @click="clearPoint">✕ Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths broken by Vite bundling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })

const props = withDefaults(
  defineProps<{
    apiKey?: string          // unused — kept for API compat with old Google Maps component
    version?: 'v1' | 'v2'
    point?: { lat: number; lng: number } | null
    polygon?: [number, number][]
    center?: { lat: number; lng: number }
    zoom?: number
    height?: string
  }>(),
  {
    version: 'v1',
    point: null,
    polygon: () => [],
    center: () => ({ lat: 11.0168, lng: 76.9558 }),
    zoom: 13,
    height: '420px',
  }
)

const emit = defineEmits<{
  (e: 'update:point', p: { lat: number; lng: number }): void
  (e: 'update:polygon', pts: [number, number][]): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const hasPoint = ref(false)

let map: L.Map | null = null
let pointMarker: L.Marker | null = null
let vertexMarkers: L.CircleMarker[] = []
let polyline: L.Polyline | null = null
let polygon: L.Polygon | null = null
const points = ref<[number, number][]>([])   // [lon, lat]

// Custom icons
const redIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#dc2626;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})



function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, { zoomControl: true }).setView(
    [props.center!.lat, props.center!.lng],
    props.zoom
  )

  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
      maxZoom: 19,
    }
  ).addTo(map)

  setTimeout(() => map?.invalidateSize(), 100)

  // Seed existing data
  if (props.point && props.version === 'v1') {
    placePoint(props.point.lat, props.point.lng)
  }
  if (props.polygon && props.polygon.length >= 3 && props.version === 'v2') {
    points.value = [...props.polygon]
    props.polygon.forEach(([lon, lat]) => addVertex(lat, lon))
    renderPoly()
  }

  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    if (props.version === 'v1') {
      placePoint(lat, lng)
      emit('update:point', { lat, lng })
    } else {
      points.value.push([lng, lat])
      addVertex(lat, lng)
      renderPoly()
      emit('update:polygon', [...points.value])
    }
  })
}

function placePoint(lat: number, lng: number) {
  if (!map) return
  if (pointMarker) pointMarker.remove()
  pointMarker = L.marker([lat, lng], { icon: redIcon }).addTo(map)
  hasPoint.value = true
}

function addVertex(lat: number, lng: number) {
  if (!map) return
  const m = L.circleMarker([lat, lng], {
    radius: 5,
    color: '#2563eb',
    fillColor: '#2563eb',
    fillOpacity: 1,
    weight: 2,
  }).addTo(map)
  vertexMarkers.push(m)
}

function renderPoly() {
  if (!map) return
  if (polyline) { polyline.remove(); polyline = null }
  if (polygon)  { polygon.remove();  polygon  = null }
  if (points.value.length < 2) return

  const latlngs = points.value.map(([lon, lat]) => [lat, lon] as [number, number])

  if (points.value.length >= 3) {
    polygon = L.polygon(latlngs, {
      color: '#2563eb',
      weight: 2,
      fillColor: '#2563eb',
      fillOpacity: 0.15,
    }).addTo(map)
  } else {
    polyline = L.polyline(latlngs, { color: '#2563eb', weight: 2 }).addTo(map)
  }
}

function undo() {
  points.value.pop()
  const m = vertexMarkers.pop()
  if (m) m.remove()
  renderPoly()
  emit('update:polygon', [...points.value])
}

function clear() {
  points.value = []
  vertexMarkers.forEach(m => m.remove())
  vertexMarkers = []
  if (polyline) { polyline.remove(); polyline = null }
  if (polygon)  { polygon.remove();  polygon  = null }
  emit('update:polygon', [])
}

function clearPoint() {
  if (pointMarker) { pointMarker.remove(); pointMarker = null }
  hasPoint.value = false
  emit('update:point', { lat: 0, lng: 0 })
}

watch(() => props.center, (c) => {
  if (map && c) map.setView([c.lat, c.lng])
}, { deep: true })

watch(() => props.point, (p) => {
  if (p && props.version === 'v1') placePoint(p.lat, p.lng)
}, { deep: true })

onMounted(() => { initMap() })
onUnmounted(() => {
  if (map) { map.remove(); map = null }
})
</script>

<style scoped>
.draw-zone { width: 100%; }
.leaflet-map {
  width: 100%;
  border-radius: 8px;
  background: #e2e8f0;
  z-index: 0;
}
.draw-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.draw-hint { font-size: 13px; color: #6b7280; }
.draw-actions { display: flex; align-items: center; gap: 8px; }
.draw-count { font-size: 12px; color: #2563eb; font-weight: 600; }
</style>
