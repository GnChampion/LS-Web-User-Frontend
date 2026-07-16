# 🚀 User Web App - Setup Guide

**Deployment:** Separate Firebase Project  
**Authentication:** Firebase Auth (Email/Password)  
**Database:** Shared Firestore (with security rules)

---

## 📋 Prerequisites

Before starting, you need:
1. New Firebase project for user web app
2. Firebase CLI installed: `npm install -g firebase-tools`
3. Node.js 18+ installed

---

## 🔥 Step 1: Create Separate Firebase Project

### 1.1 Create New Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name: `land-scanner-user-app` (or your choice)
4. Enable Google Analytics (optional)
5. Click **"Create project"**

### 1.2 Enable Authentication
1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Enable **Email/Password** sign-in method
4. Save

### 1.3 Get Firebase Config
1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"**
3. Click **"Web"** (</> icon)
4. Register app: Name it `Land Scanner User App`
5. **Copy the Firebase config** - you'll need this!

```javascript
// Save this config - we'll use it later
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "land-scanner-user-app.firebaseapp.com",
  projectId: "land-scanner-user-app",
  storageBucket: "land-scanner-user-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID"
};
```

### 1.4 Setup Firestore Database Access

Since you're using a **separate Firebase project for authentication** but want to access the **main project's Firestore data**, you have two options:

#### **Option A: Use Backend API** (Recommended for Security)
- User web app authenticates users in separate Firebase project
- All data access goes through your Backend API
- Backend API verifies tokens and fetches data from main Firestore
- ✅ Better security (no direct Firestore access)
- ✅ Centralized access control

#### **Option B: Multi-Project Firestore Access** (Advanced)
- User web app uses separate Firebase for Auth
- But connects to main project's Firestore for data
- Requires cross-project security rules
- ⚠️ More complex setup

**I recommend Option A** - we'll implement this.

---

## 🛠️ Step 2: Initialize Project

```bash
cd website-userend

# Create Vite + Vue + TypeScript project
npm create vite@latest . -- --template vue-ts

# Install dependencies
npm install

# Install Firebase SDK
npm install firebase

# Install routing and state management
npm install vue-router pinia

# Install UI utilities
npm install axios

# Install Leaflet for maps (optional)
npm install leaflet @types/leaflet

# Install dev dependencies
npm install -D @types/node
```

---

## 📁 Step 3: Project Structure

```bash
website-userend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── logo.svg
│   ├── components/
│   │   ├── Header.vue
│   │   ├── ZoneCard.vue
│   │   └── ImageGallery.vue
│   ├── views/
│   │   ├── Login.vue
│   │   ├── Register.vue
│   │   ├── Dashboard.vue
│   │   ├── MyZones.vue
│   │   ├── ZoneDetail.vue
│   │   ├── RequestZone.vue
│   │   └── Profile.vue
│   ├── stores/
│   │   ├── auth.ts
│   │   └── zones.ts
│   ├── services/
│   │   ├── firebase.ts
│   │   └── api.ts
│   ├── router/
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── .env
├── .env.example
├── firebase.json
├── .firebaserc
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⚙️ Step 4: Configuration Files

### 4.1 Environment Variables

Create `.env` file:
```env
# User Firebase Project (Separate for Auth)
VITE_FIREBASE_API_KEY=your_user_app_api_key
VITE_FIREBASE_AUTH_DOMAIN=land-scanner-user-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=land-scanner-user-app
VITE_FIREBASE_STORAGE_BUCKET=land-scanner-user-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Backend API (for data access)
VITE_BACKEND_URL=https://land-scanner-backend.onrender.com
```

Create `.env.example`:
```env
# Copy this to .env and fill in your values

# User Firebase Project
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Backend API
VITE_BACKEND_URL=http://localhost:8000
```

### 4.2 Vite Config

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3001, // Different port from admin panel
    open: true
  }
})
```

### 4.3 TypeScript Config

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 🔐 Step 5: Firebase Authentication Setup

### 5.1 Firebase Service

Create `src/services/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app'
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'

// User app Firebase config (SEPARATE PROJECT)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Auth helper functions
export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const register = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const logout = async () => {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser
  if (user) {
    return await user.getIdToken()
  }
  return null
}
```

### 5.2 Backend API Service

Create `src/services/api.ts`:
```typescript
import axios from 'axios'
import { getAuthToken } from './firebase'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

// Create axios instance
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// API methods
export const apiService = {
  // Get user's zones
  getUserZones: async (userId: string) => {
    const response = await api.get(`/api/v1/zones`, {
      params: { user_id: userId }
    })
    return response.data.data || []
  },

  // Get zone details
  getZone: async (zoneId: string) => {
    const response = await api.get(`/api/v1/zones/${zoneId}`)
    return response.data.data
  },

  // Get zone images
  getZoneImages: async (zoneId: string) => {
    const response = await api.get(`/api/v1/zones/${zoneId}/images`)
    return response.data.data || []
  },

  // Request new zone
  requestZone: async (data: {
    user_id: string
    coordinates: { latitude: number; longitude: number; altitude: number }
    zone_area?: { size_feet: number }
    quality: string
    notes?: string
  }) => {
    const response = await api.post('/api/v1/user/request-zone', data)
    return response.data
  },

  // Get user's zone requests
  getUserRequests: async (userId: string) => {
    const response = await api.get(`/api/v1/user/requests/${userId}`)
    return response.data.data || []
  },

  // Get user tier info (from backend, which accesses main Firebase)
  getUserTier: async (userId: string) => {
    const response = await api.get(`/api/v1/users/${userId}/tier`)
    return response.data.data
  }
}

export default api
```

---

## 🏪 Step 6: State Management (Pinia)

### 6.1 Auth Store

Create `src/stores/auth.ts`:
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { User } from 'firebase/auth'
import { login, register, logout, getCurrentUser } from '@/services/firebase'
import { apiService } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const userTier = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  async function checkAuth() {
    loading.value = true
    try {
      const currentUser = await getCurrentUser()
      user.value = currentUser
      
      if (currentUser) {
        // Fetch user tier from backend
        userTier.value = await apiService.getUserTier(currentUser.uid)
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const loggedInUser = await login(email, password)
      user.value = loggedInUser
      
      // Fetch user tier
      if (loggedInUser) {
        userTier.value = await apiService.getUserTier(loggedInUser.uid)
      }
      
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const newUser = await register(email, password)
      user.value = newUser
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    loading.value = true
    try {
      await logout()
      user.value = null
      userTier.value = null
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    userTier,
    loading,
    error,
    isAuthenticated,
    checkAuth,
    signIn,
    signUp,
    signOut
  }
})
```

### 6.2 Zones Store

Create `src/stores/zones.ts`:
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'

export const useZonesStore = defineStore('zones', () => {
  const zones = ref<any[]>([])
  const currentZone = ref<any>(null)
  const zoneImages = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadUserZones(userId: string) {
    loading.value = true
    error.value = null
    try {
      zones.value = await apiService.getUserZones(userId)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadZone(zoneId: string) {
    loading.value = true
    error.value = null
    try {
      currentZone.value = await apiService.getZone(zoneId)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function loadZoneImages(zoneId: string) {
    loading.value = true
    error.value = null
    try {
      zoneImages.value = await apiService.getZoneImages(zoneId)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function requestNewZone(data: any) {
    loading.value = true
    error.value = null
    try {
      await apiService.requestZone(data)
      return true
    } catch (err: any) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    zones,
    currentZone,
    zoneImages,
    loading,
    error,
    loadUserZones,
    loadZone,
    loadZoneImages,
    requestNewZone
  }
})
```

---

## 🛣️ Step 7: Router Setup

Create `src/router/index.ts`:
```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Dashboard from '@/views/Dashboard.vue'
import MyZones from '@/views/MyZones.vue'
import ZoneDetail from '@/views/ZoneDetail.vue'
import RequestZone from '@/views/RequestZone.vue'
import Profile from '@/views/Profile.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/zones',
      name: 'zones',
      component: MyZones,
      meta: { requiresAuth: true }
    },
    {
      path: '/zones/:id',
      name: 'zone-detail',
      component: ZoneDetail,
      meta: { requiresAuth: true }
    },
    {
      path: '/request',
      name: 'request-zone',
      component: RequestZone,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check auth state if not already checked
  if (authStore.user === null && !authStore.loading) {
    await authStore.checkAuth()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (requiresGuest && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
```

---

## 📱 Step 8: Main App Files

### 8.1 Main Entry

Create `src/main.ts`:
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
```

### 8.2 Root Component

Create `src/App.vue`:
```vue
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.checkAuth()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f7fa;
  color: #2d3748;
}

#app {
  min-height: 100vh;
}
</style>
```

---

## 🎨 Step 9: Basic Styling

Create `src/style.css`:
```css
/* Global Styles */
:root {
  --primary: #667eea;
  --primary-dark: #5568d3;
  --success: #48bb78;
  --danger: #f56565;
  --warning: #ed8936;
  --gray-50: #f7fafc;
  --gray-100: #edf2f7;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e0;
  --gray-600: #718096;
  --gray-700: #4a5568;
  --gray-900: #1a202c;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility Classes */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--gray-600);
}
```

---

## 🚀 Step 10: Run Development Server

```bash
cd website-userend

# Install dependencies (if not done already)
npm install

# Run dev server
npm run dev
```

Visit: http://localhost:3001

---

## 🔥 Step 11: Firebase Hosting Setup

### 11.1 Login to Firebase
```bash
firebase login
```

### 11.2 Initialize Firebase
```bash
cd website-userend
firebase init
```

Select:
- ✅ Hosting
- Choose **existing project**: `land-scanner-user-app`
- Public directory: `dist`
- Single-page app: `Yes`
- GitHub auto-deploy: `No`

### 11.3 Create `firebase.json`
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 11.4 Build & Deploy
```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

Your app will be live at:
```
https://land-scanner-user-app.web.app
```

---

## 🔐 Step 12: Backend API Updates

Your backend needs to verify tokens from the **separate Firebase project**.

### Update `backend-app/app/services/firebase_service.py`:

```python
# Add support for user app Firebase project
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Main Firebase (admin panel & data)
main_cred = credentials.Certificate('firebase-admin-sdk.json')
main_app = firebase_admin.initialize_app(main_cred, name='main')
main_db = firestore.client(main_app)

# User app Firebase (authentication only) - OPTIONAL
# Only needed if you want to verify user tokens
# Otherwise, you can just verify tokens against main Firebase
```

**Simpler Approach:** Keep using main Firebase for token verification, just create users in both Firebase projects.

---

## ✅ Testing Checklist

After setup:

1. ✅ User can register with email/password
2. ✅ User can login  
3. ✅ Token is sent to backend API
4. ✅ Backend returns user's zones
5. ✅ User can view zones and images
6. ✅ User can request new zone
7. ✅ Logout works correctly
8. ✅ Navigation guards protect routes

---

## 📞 Next Steps

1. **Create demo users** in your new Firebase project
2. **Test authentication flow**
3. **Verify backend API access**
4. **Build remaining pages** (Dashboard, Zones, etc.)

---

**Setup Complete!** 🎉

Now you have a separate Firebase project for user authentication with full backend API integration.
