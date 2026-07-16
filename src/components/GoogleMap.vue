<template>
  <div ref="mapContainer" class="google-map"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

const props = withDefaults(
  defineProps<{
    apiKey: string
    markers?: Array<{
      lat: number
      lng: number
      label?: string
      zoneId?: string
      title?: string
    }>
    center?: { lat: number; lng: number }
    zoom?: number
    height?: string
    clickable?: boolean
  }>(),
  {
    markers: () => [],
    center: () => ({ lat: 11.0168, lng: 76.9558 }),
    zoom: 13,
    height: '400px',
    clickable: false
  }
)

const emit = defineEmits<{
  (e: 'map-click', latLng: { lat: number; lng: number }): void
  (e: 'marker-click', marker: { lat: number; lng: number; label?: string; zoneId?: string; title?: string }): void
  (e: 'map-ready', map: google.maps.Map): void
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: google.maps.Map | null = null
let markerObjects: google.maps.Marker[] = []

const loader = new Loader({
  apiKey: props.apiKey,
  version: 'weekly',
  libraries: ['places']
})

async function initMap() {
  if (!mapContainer.value || !props.apiKey) return

  loader.load().then(() => {
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

    renderMarkers()

    if (props.clickable) {
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const latLng = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          }
          emit('map-click', latLng)
        }
      })
    }

    emit('map-ready', map)
  })
}

function renderMarkers() {
  if (!map) return

  markerObjects.forEach((m) => m.setMap(null))
  markerObjects = []

  props.markers.forEach((markerData) => {
    const marker = new google.maps.Marker({
      position: { lat: markerData.lat, lng: markerData.lng },
      map,
      title: markerData.title || markerData.label || 'Zone',
      animation: google.maps.Animation.DROP,
      label: markerData.label ? { text: markerData.label, color: 'white', fontSize: '12px' } : undefined
    })

    if (markerData.zoneId || markerData.title) {
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="font-size:13px;"><strong>${markerData.title || markerData.label || 'Zone'}</strong><br/>${markerData.lat.toFixed(6)}, ${markerData.lng.toFixed(6)}</div>`
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        emit('marker-click', markerData)
      })
    }

    markerObjects.push(marker)
  })
}

watch(
  () => [props.center, props.zoom, props.markers] as const,
  () => {
    if (!map) return

    map.setCenter(props.center)
    map.setZoom(props.zoom)
    renderMarkers()
  }
)

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  markerObjects.forEach((m) => m.setMap(null))
  markerObjects = []
  map = null
})
</script>

<style scoped>
.google-map {
  width: 100%;
  height: v-bind('height');
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
}
</style>
