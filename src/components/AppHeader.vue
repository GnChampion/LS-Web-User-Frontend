<template>
  <header class="header">
    <div class="container">
      <div class="header-content">
        <div class="header-brand">
          <router-link to="/" class="brand-title">🛰️ Land Scanner</router-link>
        </div>

        <!-- Desktop Nav -->
        <nav class="header-nav desktop-nav">
          <router-link to="/" class="nav-link" exact-active-class="active">Dashboard</router-link>
          <router-link to="/zones" class="nav-link" active-class="active">My Zones</router-link>
          <router-link to="/requests" class="nav-link" active-class="active">Requests</router-link>
          <router-link to="/profile" class="nav-link" active-class="active">Profile</router-link>
          <button @click="handleLogout" class="btn btn-secondary btn-sm">Logout</button>
        </nav>

        <!-- Mobile Hamburger -->
        <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- Mobile Nav Drawer -->
    <div v-if="menuOpen" class="mobile-nav" @click="menuOpen = false">
      <div class="mobile-nav-inner" @click.stop>
        <router-link to="/" class="mobile-nav-link" exact-active-class="active" @click="menuOpen = false">Dashboard</router-link>
        <router-link to="/zones" class="mobile-nav-link" active-class="active" @click="menuOpen = false">My Zones</router-link>
        <router-link to="/requests" class="mobile-nav-link" active-class="active" @click="menuOpen = false">Requests</router-link>
        <router-link to="/profile" class="mobile-nav-link" active-class="active" @click="menuOpen = false">Profile</router-link>
        <button @click="handleLogout" class="btn btn-danger btn-sm mt-md" style="width:100%">Logout</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const menuOpen = ref(false)

const handleLogout = async () => {
  menuOpen.value = false
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

.brand-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-800);
  text-decoration: none;
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
  transition: all 0.2s;
  text-decoration: none;
}

.nav-link:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}

.nav-link.active {
  background: var(--primary);
  color: white;
}

/* Hamburger */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.hamburger span {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--gray-700);
  border-radius: 2px;
  transition: all 0.2s;
}

/* Mobile Nav */
.mobile-nav {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  top: 57px;
}

.mobile-nav-inner {
  background: white;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-lg);
}

.mobile-nav-link {
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 500;
  color: var(--gray-700);
  text-decoration: none;
  transition: all 0.2s;
}

.mobile-nav-link:hover,
.mobile-nav-link.active {
  background: var(--primary);
  color: white;
}

@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .hamburger {
    display: flex;
  }
}
</style>
