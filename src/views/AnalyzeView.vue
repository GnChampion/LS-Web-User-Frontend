<template>
  <div class="page">
    <AppHeader />
    <main class="main-content">
      <div class="container-sm">
        <h2 class="page-title">Analysis</h2>
        <div class="empty-state">
          <div class="empty-icon">🛰️</div>
          <div class="empty-title">Analysis is managed by admin</div>
          <p class="empty-text">
            Satellite data analysis is triggered by the admin team. Once your zone is approved and
            processed, the results will appear under <strong>My Zones</strong>.
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
