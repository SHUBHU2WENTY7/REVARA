// ==============================================================================
// REVARA DASHBOARD — FIREBASE AUTH INTEGRATION
// Seamless authentication via Firebase Auth (Google, GitHub, Email/Password)
// ==============================================================================

import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth"
import type { AdminUser } from "@/types"
import { supabase } from "@/lib/supabase"

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCeDDnKTgZ4UwwgH2ckdLtI3YWlmHNFOME",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tff0-bbfc3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tff0-bbfc3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tff0-bbfc3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "901125170155",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:901125170155:web:51e1c41b6cc7eae167afae",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FLW3YP48ZD",
}

// Initialize Firebase (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: "select_account" })

export const githubProvider = new GithubAuthProvider()

const SESSION_KEY = "revara_admin_session"
const CLAIMED_ADMINS_KEY = "revara_claimed_admins"

// List of pre-authorized admin emails & domain whitelist
const PRE_AUTHORIZED_EMAILS = [
  "admin@revara.in",
  "admin@revara.shopping",
]

function getClaimedAdmins(): string[] {
  try {
    const raw = localStorage.getItem(CLAIMED_ADMINS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addClaimedAdmin(email: string) {
  try {
    const claimed = getClaimedAdmins()
    if (!claimed.includes(email.toLowerCase())) {
      claimed.push(email.toLowerCase())
      localStorage.setItem(CLAIMED_ADMINS_KEY, JSON.stringify(claimed))
    }
  } catch (e) {
    console.error("Failed to store claimed admin:", e)
  }
}

/**
 * Checks whether an email has dashboard administrative privileges:
 * 1. Pre-authorized email list
 * 2. @revara.in or @revara.shopping corporate domains
 * 3. Locally claimed admins (from "Claim Admin" button)
 * 4. Supabase dashboard_admins table (if configured)
 */
export async function isEmailAuthorizedAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false
  const lower = email.toLowerCase().trim()

  // 1. Direct whitelist
  if (PRE_AUTHORIZED_EMAILS.includes(lower)) return true

  // 2. Domain check
  if (lower.endsWith("@revara.in") || lower.endsWith("@revara.shopping")) return true

  // 3. Claimed admin list in localStorage
  if (getClaimedAdmins().includes(lower)) return true

  // 4. Supabase dashboard_admins table check
  try {
    const { data } = await supabase
      .from("dashboard_admins")
      .select("is_active")
      .eq("email", lower)
      .maybeSingle()

    if (data?.is_active) return true
  } catch {
    // Non-fatal if Supabase table is unreachable
  }

  return false
}

export function mapFirebaseUserToAdmin(user: User, isSuperAdmin: boolean = false): AdminUser {
  return {
    id: user.uid,
    email: user.email || "admin@revara.in",
    adminRole: isSuperAdmin ? "super_admin" : "operations_admin",
    displayName: user.displayName || user.email?.split("@")[0] || "Administrator",
    avatarUrl: user.photoURL || undefined,
  }
}

export function getStoredAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveAdminSession(admin: AdminUser | null) {
  try {
    if (admin) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(admin))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  } catch (e) {
    console.error("Failed to persist admin session:", e)
  }
}

// ── Auth Actions ─────────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<AdminUser> {
  const result = await signInWithPopup(auth, googleProvider)
  const isAuth = await isEmailAuthorizedAdmin(result.user.email)
  const admin = mapFirebaseUserToAdmin(result.user, result.user.email?.includes("admin"))
  
  if (!isAuth) {
    // If not pre-authorized, user can still use the Claim Admin screen
    saveAdminSession(null)
    const unauthorizedErr = new Error(`Access Restricted: ${result.user.email} is not listed as an authorized administrator.`)
    ;(unauthorizedErr as any).isUnauthorizedUser = true
    ;(unauthorizedErr as any).user = result.user
    throw unauthorizedErr
  }

  saveAdminSession(admin)
  return admin
}

export async function signInWithGithub(): Promise<AdminUser> {
  const result = await signInWithPopup(auth, githubProvider)
  const isAuth = await isEmailAuthorizedAdmin(result.user.email)
  const admin = mapFirebaseUserToAdmin(result.user, false)

  if (!isAuth) {
    saveAdminSession(null)
    const unauthorizedErr = new Error(`Access Restricted: ${result.user.email} is not listed as an authorized administrator.`)
    ;(unauthorizedErr as any).isUnauthorizedUser = true
    ;(unauthorizedErr as any).user = result.user
    throw unauthorizedErr
  }

  saveAdminSession(admin)
  return admin
}

export async function signInWithEmail(email: string, pass: string): Promise<AdminUser> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass)
    const isAuth = await isEmailAuthorizedAdmin(result.user.email)
    const admin = mapFirebaseUserToAdmin(result.user, result.user.email?.includes("admin"))

    if (!isAuth) {
      saveAdminSession(null)
      const unauthorizedErr = new Error(`Access Restricted: ${result.user.email} is not listed as an authorized administrator.`)
      ;(unauthorizedErr as any).isUnauthorizedUser = true
      ;(unauthorizedErr as any).user = result.user
      throw unauthorizedErr
    }

    saveAdminSession(admin)
    return admin
  } catch (err: any) {
    // Handle standard demo or test bypass if Firebase account doesn't exist yet
    if (email === "admin@revara.in" && pass === "admin123") {
      const devAdmin: AdminUser = {
        id: "firebase-dev-super-admin",
        email: "admin@revara.in",
        adminRole: "super_admin",
        displayName: "Super Administrator",
      }
      saveAdminSession(devAdmin)
      return devAdmin
    }
    throw err
  }
}

export async function signUpWithEmail(email: string, pass: string, name?: string): Promise<AdminUser> {
  const result = await createUserWithEmailAndPassword(auth, email, pass)
  // Automatically authorize self-registered accounts on development dashboard
  addClaimedAdmin(email)
  const admin: AdminUser = {
    id: result.user.uid,
    email: result.user.email || email,
    adminRole: "operations_admin",
    displayName: name || email.split("@")[0],
  }
  saveAdminSession(admin)
  return admin
}

export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch {
    // ignore
  } finally {
    saveAdminSession(null)
  }
}
