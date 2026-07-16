// Import Vue and create app
import { createApp } from 'vue'
// Import Pinia for state management
import { createPinia } from 'pinia'
// Import the root App component
import App from './App.vue'
// Import router
import router from './router'
// Import Element Plus and its styles
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// Import Element Plus icons
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// Import global styles
import './styles/main.scss'
// Import i18n
import { createI18n } from 'vue-i18n'
// Import English translations
import en from './locales/en'

// Create the app instance
const app = createApp(App)

// Create Pinia instance
const pinia = createPinia()

// Create i18n instance
const i18n = createI18n({
  locale: 'en', // default locale
  fallbackLocale: 'en',
  messages: {
    en
  }
})

// Register all Element Plus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Install plugins
app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  size: 'default', // default size for components
  zIndex: 3000 // default z-index for popups
})
app.use(i18n)

// Mount the app to the DOM
app.mount('#app')
