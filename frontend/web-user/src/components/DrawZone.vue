<template>
  <div class="draw-zone">
    <div ref="mapContainer" class="google-map"></div>
    <div class="draw-toolbar">
      <span class="draw-hint">
        {{ mode === 'draw' ? 'Click the map to add border points (min 3).' : 'Click a point to drop the v1 marker.' }}
      </span>
      <div class="draw-actions">
        <button type="button" class="btn btn-sm" :class="mode === 'draw' ? 'btn-primary' : 'btn-secondary'"
                @click="toggleMode">
          {{ mode === 'draw' ? 'Drawing v2 border' : 'Draw v2 border' }}
        </button>
        <button type="button" class="btn btn-sm btn-secondary" :disabled="points.length === 0" @click="undo">
          Undo
        </button>
        <button type="button" class="btn btn-sm btn-secondary" :disabled="points.length === 0" @click="clear">
          Clear
        </button>
        <span v-if="points.length > 0" class="draw-count">{{ points.length }} pts</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

const props = withDefaults(
  defineProps<{
    apiKey: string
    version?: 'v1' | 'v2'
    point?: { lat: number; lng: number } | null
    polygon?: [number, number][]   // [lon, lat] points
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
    height: '420px'
  }
)

const emit = defineEmits<{
  (e: 'update:point', p: { lat: number; lng: number }): void
  (e: 'update:polygon', pts: [number, number][]): void
  (e: 'map-ready', map: google.maps.Map): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: google.maps.Map | null = null
let pointMarker: google.maps.Marker | null = null
let vertexMarkers: google.maps.Marker[] = []
let polygonOverlay: google.maps.Polygon | null = null

const mode = ref<'point' | 'draw'>(props.version === 'v2' ? 'draw' : 'point')
const points = ref<[number, number][]>([])   // [lon, lat]

const loader = new Loader({ apiKey: props.apiKey, version: 'weekly', libraries: ['places'] })

async function initMap() {
  if (!mapContainer.value || !props.apiKey) return
  await loader.load()
  if (!mapContainer.value) return

  map = new google.maps.Map(mapContainer.value, {
    center: props.center,
    zoom: props.zoom,
    mapTypeId: 'satellite',
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true
  })

  // Seed existing point + polygon.
  if (props.point) addPointMarker(props.point.lat, props.point.lng)
  if (props.polygon && props.polygon.length >= 3) {
    points.value = props.polygon.map((p) => [p[0], p[1]] as [number, number])
    renderPolygon()
  }

  map.addListener('click', (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return
    const lat = event.latLng.lat()
    const lng = event.latLng.lng()
    if (mode.value === 'draw') {
      if (points.value.length < 200) {
        points.value.push([lng, lat])
        addVertexMarker(lat, lng)
        renderPolygon()
        emit('update:polygon', [...points.value])
      }
    } else {
      addPointMarker(lat, lng)
      emit('update:point', { lat, lng })
    }
  })

  emit('map-ready', map)
}

function addPointMarker(lat: number, lng: number) {
  if (!map) return
  if (pointMarker) pointMarker.setMap(null)
  pointMarker = new google.maps.Marker({
    position: { lat, lng },
    map,
    title: 'v1 point',
    icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }
  })
}

function addVertexMarker(lat: number, lng: number) {
  if (!map) return
  const m = new google.maps.Marker({
    position: { lat, lng },
    map,
    title: `v2 pt ${vertexMarkers.length + 1}`,
    icon: { url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }
  })
  vertexMarkers.push(m)
}

function renderPolygon() {
  if (!map) return
  if (polygonOverlay) {
    polygonOverlay.setMap(null)
    polygonOverlay = null
  }
  if (points.value.length < 3) return
  const path = points.value.map(([lng, lat]) => ({ lat, lng }))
  polygonOverlay = new google.maps.Polygon({
    paths: path,
    strokeColor: '#2563eb',
    strokeOpacity: 0.9,
    strokeWeight: 2,
    fillColor: '#2563eb',
    fillOpacity: 0.18,
    map
  })
}

function toggleMode() {
  mode.value = mode.value === 'draw' ? 'point' : 'draw'
}

function undo() {
  points.value.pop()
  const m = vertexMarkers.pop()
  if (m) m.setMap(null)
  renderPolygon()
  emit('update:polygon', [...points.value])
}

function clear() {
  points.value = []
  vertexMarkers.forEach((m) => m.setMap(null))
  vertexMarkers = []
  if (polygonOverlay) polygonOverlay.setMap(null)
  polygonOverlay = null
  emit('update:polygon', [])
}

watch(() => props.point, (p) => { if (p) addPointMarker(p.lat, p.lng) }, { deep: true })
watch(() => props.center, (c) => { if (map && c) map.setCenter(c) }, { deep: true })

onMounted(() => { initMap() })
onUnmounted(() => {
  if (pointMarker) pointMarker.setMap(null)
  vertexMarkers.forEach((m) => m.setMap(null))
  if (polygonOverlay) polygonOverlay.setMap(null)
  map = null
})
</script>

<style scoped>
.draw-zone { width: 100%; }
.google-map {
  width: 100%;
  height: v-bind('height');
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
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
