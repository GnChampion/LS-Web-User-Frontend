<template>
  <div class="not-found">
    <div class="not-found__inner">
      <h1>404</h1>
      <p>The page you are looking for could not be found.</p>
      <router-link to="/" class="btn btn-primary">Back to Dashboard</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--color-bg, #f5f7fa);
}

.not-found__inner {
  text-align: center;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.not-found h1 {
  font-size: 64px;
  margin: 0 0 8px;
  color: var(--color-primary, #2563eb);
}

.not-found p {
  margin: 0 0 24px;
  color: var(--color-text-muted, #6b7280);
}
</style>
