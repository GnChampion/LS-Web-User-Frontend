import { initializeApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail
} from 'firebase/auth'

// User app Firebase config (SEPARATE PROJECT for authentication).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Auth is OPTIONAL for local preview (set VITE_REQUIRE_AUTH=false). The prototype
// flow goes through the publishing delivery layer which needs no user login.
export const requireAuth = (import.meta.env.VITE_REQUIRE_AUTH as string | undefined) !== 'false'

// Initialize the app whenever web config is present — Firestore needs it too,
// even when auth is disabled.
let app: any = null
if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig)
}
export const db: Firestore | null = app ? getFirestore(app) : null

// Auth is enabled only when both the config and VITE_REQUIRE_AUTH are set.
let auth: any = null
if (app && requireAuth) {
  auth = getAuth(app)
}

// Auth helper functions
export const login = async (email: string, password: string) => {
  if (!auth) throw new Error('Auth disabled (preview mode)')
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error('Login error:', error)
    throw new Error(getErrorMessage(error.code))
  }
}

export const register = async (email: string, password: string) => {
  if (!auth) throw new Error('Auth disabled (preview mode)')
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error('Registration error:', error)
    throw new Error(getErrorMessage(error.code))
  }
}

export const logout = async () => {
  if (!auth) return
  try {
    await signOut(auth)
  } catch (error: any) {
    console.error('Logout error:', error)
    throw new Error('Failed to logout')
  }
}

export const resetPassword = async (email: string) => {
  if (!auth) return
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    console.error('Password reset error:', error)
    throw new Error(getErrorMessage(error.code))
  }
}

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    if (!auth) return resolve(null)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

export const getAuthToken = async (): Promise<string | null> => {
  if (!auth || !auth.currentUser) return null
  return await auth.currentUser.getIdToken()
}

// Error message mapping
const getErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'Email already in use',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/operation-not-allowed': 'Operation not allowed',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/too-many-requests': 'Too many attempts. Please try again later'
  }
  return messages[code] || 'Authentication error occurred'
}
