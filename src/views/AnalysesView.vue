<template>
  <div class="page">
    <AppHeader />
    <main class="main-content">
      <div class="container">
        <h2 class="page-title">Analysis Results</h2>
        <div class="empty-state">
          <div class="empty-icon">🛰️</div>
          <div class="empty-title">Results are delivered to your zones</div>
          <p class="empty-text">
            Once the admin processes your zone, satellite data and imagery will appear
            under <strong>My Zones</strong> for each zone.
          </p>
          <router-link to="/zones" class="btn btn-primary mt-md">View My Zones</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
</script>

<style scoped>
.page { min-height: 100vh; background: var(--gray-50); }
.main-content { padding: var(--spacing-xl) 0; }
.page-title { font-size: 32px; font-weight: 700; color: var(--gray-800); margin-bottom: var(--spacing-xl); }
</style>
