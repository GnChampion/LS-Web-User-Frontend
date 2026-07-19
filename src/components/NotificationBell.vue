<template>
  <div class="notification-bell">
    <button @click="togglePanel" class="bell-button" :class="{ 'has-unread': unreadCount > 0 }">
      🔔
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <teleport to="body">
      <div v-if="showPanel" class="notification-panel-overlay" @click="showPanel = false">
        <div class="notification-panel" @click.stop>
          <div class="panel-header">
            <h3>Notifications</h3>
            <button v-if="unreadCount > 0" @click="markAllRead" class="mark-read-btn">Mark all read</button>
            <button @click="showPanel = false" class="close-btn">✕</button>
          </div>

          <div class="panel-body">
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>Loading notifications...</p>
            </div>

            <div v-else-if="!notifications.length" class="empty-state">
              <div class="empty-icon">🔕</div>
              <p>No notifications yet</p>
            </div>

            <div v-else class="notifications-list">
              <div
                v-for="notif in notifications"
                :key="notif.id"
                class="notification-item"
                :class="{ unread: !notif.read }"
                @click="handleClick(notif)"
              >
                <div class="notif-icon">{{ getIcon(notif.type) }}</div>
                <div class="notif-content">
                  <div class="notif-title">{{ notif.title }}</div>
                  <div class="notif-message">{{ notif.message }}</div>
                  <div class="notif-meta">
                    <span>{{ formatTime(notif.created_at) }}</span>
                    <span v-if="notif.quality_score != null" class="quality-badge" :class="qualityClass(notif.quality_score)">
                      {{ (notif.quality_score * 100).toFixed(0) }}%
                    </span>
                  </div>
                </div>
                <button v-if="!notif.read" @click.stop="markRead(notif.id)" class="mark-read-icon">✓</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/services/firebase'
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, writeBatch } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const showPanel = ref(false)
const loading = ref(true)
const notifications = ref<any[]>([])
let unsubscribe: (() => void) | null = null

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

onMounted(() => {
  if (!auth.user?.uid || !db) {
    loading.value = false
    return
  }

  // Real-time listener for notifications
  const q = query(
    collection(db, 'notifications'),
    where('user_id', '==', auth.user.uid),
    orderBy('created_at', 'desc'),
    limit(50)
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    notifications.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate() || new Date()
    }))
    loading.value = false
  }, (error) => {
    console.error('Notification listener error:', error)
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

function togglePanel() {
  showPanel.value = !showPanel.value
}

async function markRead(notifId: string) {
  if (!db) return
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  }
}

async function markAllRead() {
  if (!db) return
  try {
    const batch = writeBatch(db)
    const unreadNotifs = notifications.value.filter(n => !n.read)
    unreadNotifs.forEach(n => {
      const notifRef = doc(db!, 'notifications', n.id)
      batch.update(notifRef, { read: true })
    })
    await batch.commit()
  } catch (error) {
    console.error('Failed to mark all as read:', error)
  }
}

function handleClick(notif: any) {
  if (!notif.read) {
    markRead(notif.id)
  }
  if (notif.link) {
    showPanel.value = false
    router.push(notif.link)
  }
}

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    task_complete: '✅',
    task_failed: '❌',
    task_partial: '⚠️',
    zone_created: '📍',
    webhook_notification: '📬',
    system: 'ℹ️'
  }
  return icons[type] || '🔔'
}

function qualityClass(score: number): string {
  if (score >= 0.75) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

function formatTime(date: Date): string {
  if (!date) return ''
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.notification-bell { position: relative; }

.bell-button {
  position: relative;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.bell-button:hover { background: rgba(0, 0, 0, 0.05); }
.bell-button.has-unread { animation: ring 2s ease-in-out infinite; }

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-10deg); }
  20%, 40% { transform: rotate(10deg); }
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.notification-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  padding-top: 60px;
  padding-right: 20px;
}

.notification-panel {
  background: white;
  width: 400px;
  max-height: 600px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
}

.mark-read-btn, .close-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.mark-read-btn:hover, .close-btn:hover { background: #f3f4f6; }

.panel-body {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  max-height: 520px;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon { font-size: 40px; margin-bottom: 12px; }

.notifications-list { padding: 8px 0; }

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover { background: #f9fafb; }
.notification-item.unread { background: #eff6ff; }

.notif-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.notif-message {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 6px;
}

.notif-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #9ca3af;
}

.quality-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 10px;
}

.quality-badge.high { background: #dcfce7; color: #15803d; }
.quality-badge.medium { background: #fef9c3; color: #a16207; }
.quality-badge.low { background: #fee2e2; color: #b91c1c; }

.mark-read-icon {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}

.mark-read-icon:hover { opacity: 0.7; }

@media (max-width: 640px) {
  .notification-panel-overlay {
    padding: 0;
    align-items: stretch;
  }
  .notification-panel {
    width: 100%;
    max-height: 100%;
    border-radius: 0;
  }
}
</style>
