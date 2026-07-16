<template>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <router-link to="/" class="header-brand">
          <h1 class="brand-title">🛰️ Land Scanner</h1>
        </router-link>
        
        <!-- Desktop Navigation -->
        <nav class="header-nav">
          <router-link to="/" class="nav-link">Dashboard</router-link>
          <router-link to="/zones" class="nav-link">My Zones</router-link>
          <router-link to="/requests" class="nav-link">Requests</router-link>
          <router-link to="/profile" class="nav-link">Profile</router-link>
          <button @click="handleLogout" class="btn btn-secondary btn-sm">
            Logout
          </button>
        </nav>

        <!-- Mobile Menu Button -->
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <span v-if="!mobileMenuOpen">☰</span>
          <span v-else>✕</span>
        </button>
      </div>

      <!-- Mobile Navigation -->
      <nav v-if="mobileMenuOpen" class="mobile-nav">
        <router-link to="/" class="mobile-nav-link" @click="mobileMenuOpen = false">
          Dashboard
        </router-link>
        <router-link to="/zones" class="mobile-nav-link" @click="mobileMenuOpen = false">
          My Zones
        </router-link>
        <router-link to="/requests" class="mobile-nav-link" @click="mobileMenuOpen = false">
          Requests
        </router-link>
        <router-link to="/profile" class="mobile-nav-link" @click="mobileMenuOpen = false">
          Profile
        </router-link>
        <button @click="handleLogout" class="btn btn-secondary btn-block mt-md">
          Logout
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped>
.header {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.header-brand {
  text-decoration: none;
}

.brand-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.nav-link {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-600);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}

.nav-link.router-link-active {
  background: var(--primary);
  color: white;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: var(--spacing-sm);
  color: var(--gray-700);
}

.mobile-nav {
  display: none;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  margin-top: var(--spacing-md);
  border-top: 1px solid var(--gray-200);
}

.mobile-nav-link {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 500;
  color: var(--gray-700);
  text-decoration: none;
  transition: background 0.2s;
}

.mobile-nav-link:hover {
  background: var(--gray-100);
}

.mobile-nav-link.router-link-active {
  background: var(--primary);
  color: white;
}

@media (max-width: 768px) {
  .header-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-nav {
    display: flex;
  }
}
</style>
