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
    // Check if we're on the client side
    if (typeof window !== "undefined") {
      // Clean up legacy localStorage tokens (security improvement)
      // We now rely solely on httpOnly cookies for authentication
      localStorage.removeItem("auth_token")

      // Check for admin token in cookies (the only valid auth method)
      const adminToken = getCookie("admin_token")
      if (adminToken) {
        // Verify admin token with server
        verifyAdminToken(adminToken)
      } else {
        // No token - try to restore cached user display data only
        const storedUser = localStorage.getItem("admin_user_display")
        if (storedUser) {
          try {
            // This is display-only data, not auth - still need to verify with server
            // Just clear it since we have no valid token
            localStorage.removeItem("admin_user_display")
          } catch {
            localStorage.removeItem("admin_user_display")
          }
        }
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  // Helper function to get cookie value
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return null
  }

  // Verify admin token with server
  const verifyAdminToken = async (token: string) => {
    try {
      const response = await fetch("/api/admin/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        setAccessToken(token)
        console.log("Admin token verified successfully")
      } else {
        console.log("Admin token verification failed:", data.message)
        // Clear invalid token
        document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      }
    } catch (error) {
      console.error("Error verifying admin token:", error)
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