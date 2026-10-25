// ==============================================================================
// REVARA DASHBOARD — AUTHENTICATION HOOK (POWERED BY FIREBASE AUTH)
// Multi-provider auth with Google, GitHub, Email/Pass and instant dev bypass
// ==============================================================================

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react"
import React from "react"
import type { AdminUser } from "@/types"
import {
  auth,
  signInWithGoogle,
  signInWithGithub,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  getStoredAdminSession,
  saveAdminSession,
  isEmailAuthorizedAdmin,
  addClaimedAdmin,
  mapFirebaseUserToAdmin,
} from "@/lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"

interface AuthContextType {
  admin: AdminUser | null
  isLoading: boolean
  unauthorizedUser: { email: string; uid: string } | null
  claimAdminAccess: () => Promise<void>
  oauthError: string | null
  clearOAuthError: () => void
  login: (email: string, pass: string) => Promise<AdminUser>
  register: (email: string, pass: string, name?: string) => Promise<AdminUser>
  loginWithGoogle: () => Promise<void>
  loginWithGithub: () => Promise<void>
  logout: () => Promise<void>
  quickDevLogin: () => Promise<AdminUser>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => getStoredAdminSession())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [unauthorizedUser, setUnauthorizedUser] = useState<{ email: string; uid: string } | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)

  const clearOAuthError = useCallback(() => {
    setOauthError(null)
  }, [])

  useEffect(() => {
    // Check initial stored admin
    const stored = getStoredAdminSession()
    if (stored) {
      setAdmin(stored)
      document.documentElement.classList.add("admin-authenticated")
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      try {
        if (user) {
          const isAuth = await isEmailAuthorizedAdmin(user.email)
          if (isAuth) {
            const adminData = mapFirebaseUserToAdmin(user, user.email?.includes("admin"))
            setAdmin(adminData)
            saveAdminSession(adminData)
            setUnauthorizedUser(null)
            document.documentElement.classList.add("admin-authenticated")
          } else {
            // User authenticated in Firebase, but not yet approved as admin
            setUnauthorizedUser({ email: user.email || "", uid: user.uid })
            setAdmin(null)
            saveAdminSession(null)
            document.documentElement.classList.remove("admin-authenticated")
          }
        } else {
          // If no Firebase session and no stored mock admin session
          const persistent = getStoredAdminSession()
          if (!persistent) {
            setAdmin(null)
            document.documentElement.classList.remove("admin-authenticated")
          }
        }
      } catch (err) {
        console.error("Firebase auth state change error:", err)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, pass: string) => {
    setOauthError(null)
    setUnauthorizedUser(null)
    try {
      const authed = await signInWithEmail(email, pass)
      setAdmin(authed)
      document.documentElement.classList.add("admin-authenticated")
      return authed
    } catch (err: any) {
      if (err.isUnauthorizedUser) {
        setUnauthorizedUser({ email: err.user.email, uid: err.user.uid })
      }
      throw err
    }
  }

  const register = async (email: string, pass: string, name?: string) => {
    setOauthError(null)
    setUnauthorizedUser(null)
    const user = await signUpWithEmail(email, pass, name)
    setAdmin(user)
    document.documentElement.classList.add("admin-authenticated")
    return user
  }

  const loginWithGoogle = async () => {
    setOauthError(null)
    setUnauthorizedUser(null)
    try {
      const authed = await signInWithGoogle()
      setAdmin(authed)
      document.documentElement.classList.add("admin-authenticated")
    } catch (err: any) {
      if (err.isUnauthorizedUser) {
        setUnauthorizedUser({ email: err.user.email, uid: err.user.uid })
      } else if (err.code === "auth/popup-closed-by-user") {
        // User closed popup without logging in, don't show noisy error
        return
      } else {
        setOauthError(err.message || "Failed to authenticate with Google")
      }
      throw err
    }
  }

  const loginWithGithub = async () => {
    setOauthError(null)
    setUnauthorizedUser(null)
    try {
      const authed = await signInWithGithub()
      setAdmin(authed)
      document.documentElement.classList.add("admin-authenticated")
    } catch (err: any) {
      if (err.isUnauthorizedUser) {
        setUnauthorizedUser({ email: err.user.email, uid: err.user.uid })
      } else if (err.code === "auth/popup-closed-by-user") {
        return
      } else {
        setOauthError(err.message || "Failed to authenticate with GitHub")
      }
      throw err
    }
  }

  const claimAdminAccess = async () => {
    if (unauthorizedUser?.email) {
      addClaimedAdmin(unauthorizedUser.email)
      const newAdmin: AdminUser = {
        id: unauthorizedUser.uid || "claimed-admin",
        email: unauthorizedUser.email,
        adminRole: "operations_admin",
        displayName: unauthorizedUser.email.split("@")[0],
      }
      setAdmin(newAdmin)
      saveAdminSession(newAdmin)
      setUnauthorizedUser(null)
      document.documentElement.classList.add("admin-authenticated")
    }
  }

  const logout = async () => {
    await signOutUser()
    setAdmin(null)
    setUnauthorizedUser(null)
    document.documentElement.classList.remove("admin-authenticated")
  }

  // Quick 1-click super admin bypass for local and staging environments
  const quickDevLogin = async () => {
    setOauthError(null)
    setUnauthorizedUser(null)
    const superAdmin: AdminUser = {
      id: "super-admin-bypass-001",
      email: "admin@revara.in",
      adminRole: "super_admin",
      displayName: "Lead Systems Director",
    }
    setAdmin(superAdmin)
    saveAdminSession(superAdmin)
    document.documentElement.classList.add("admin-authenticated")
    return superAdmin
  }

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        admin,
        isLoading,
        unauthorizedUser,
        claimAdminAccess,
        oauthError,
        clearOAuthError,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
        logout,
        quickDevLogin,
      },
    },
    children
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
