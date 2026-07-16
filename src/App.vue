<template>
  <div id="app">
    <div v-if="initializing" class="app-loading">
      <div class="loading loading-lg" style="border-color: rgba(102,126,234,0.3); border-top-color: #667eea;"></div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const initializing = ref(true)

onMounted(async () => {
  await authStore.checkAuth()
  initializing.value = false
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #f5f7fa;
  color: #2d3748;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}

.app-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
</style>
