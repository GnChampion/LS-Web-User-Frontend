import { db } from './firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'

// Thin Firestore wrapper for FRONTEND client data.
//
// Backend processing data lives in Postgres (Render). This store holds per-user
// client state only: the user profile, saved zones (bookmarks), and a small
// cache of analysis references. Every call is a no-op / returns empty when
// Firebase isn't configured (no web config present at build time).

export interface UserProfile {
  email?: string
  displayName?: string
  tierId?: string
  createdAt?: unknown
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function setUserProfile(uid: string, profile: UserProfile): Promise<void> {
  if (!db) return
  await setDoc(doc(db, 'users', uid), { ...profile, createdAt: serverTimestamp() }, { merge: true })
}

export interface SavedZone {
  id?: string
  ownerId: string
  name: string
  lat: number
  lon: number
  analysisId?: string
  createdAt?: unknown
}

export async function listSavedZones(uid: string): Promise<SavedZone[]> {
  if (!db) return []
  const q = query(
    collection(db, 'savedZones'),
    where('ownerId', '==', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SavedZone) }))
}

export async function addSavedZone(zone: SavedZone): Promise<string | null> {
  if (!db) return null
  const ref = await addDoc(collection(db, 'savedZones'), {
    ...zone,
    createdAt: serverTimestamp()
  })
  return ref.id
}

export async function removeSavedZone(zoneId: string): Promise<void> {
  if (!db) return
  await deleteDoc(doc(db, 'savedZones', zoneId))
}
