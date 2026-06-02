"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface User {
  _id: string;
  email: string;
  name: string;
  role: "SuperAdmin" | "Admin" | "User";
  isActive: boolean;
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")

      // Verify admin session whenever we're in the admin context. On the admin
      // subdomain the middleware rewrites "/" -> "/s/admin", so the browser path
      // can be "/" even though we're on an admin page — detect via hostname too.
      const { hostname, pathname } = window.location
      const isAdminRoute =
        hostname.startsWith("admin.") ||
        pathname.startsWith("/s/admin") ||
        pathname.startsWith("/admin")

      if (isAdminRoute) {
        verifyAdminSession()
      } else {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  // Verify admin session with server
  // The httpOnly cookie is automatically sent with credentials: "include"
  const verifyAdminSession = async () => {
    try {
      const response = await fetch("/api/admin/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: sends httpOnly cookies automatically
      })

      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        setAccessToken("valid") // Token is in httpOnly cookie, just mark as valid
        console.log("Admin session verified successfully")
      } else {
        console.log("Admin session verification failed:", data.message || data.error)
        // Clear any cached user display data
        localStorage.removeItem("admin_user_display")
      }
    } catch (error) {
      console.error("Error verifying admin session:", error)
      localStorage.removeItem("admin_user_display")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Store user display data only (non-sensitive info for UI)
      // Authentication is handled by httpOnly cookies
      if (user) {
        localStorage.setItem("admin_user_display", JSON.stringify({
          name: user.name,
          role: user.role,
        }))
      } else {
        localStorage.removeItem("admin_user_display")
      }
      // Note: We no longer store auth_token in localStorage for security
      // The admin_token cookie handles authentication
    }
  }, [user])

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    setUser,
    setAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}