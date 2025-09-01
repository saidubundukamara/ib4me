"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
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
      // First check localStorage for regular user tokens
      const storedToken = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("user")

      if (storedToken && storedUser) {
        try {
          setAccessToken(storedToken)
          setUser(JSON.parse(storedUser))
          setIsLoading(false)
          return
        } catch (error) {
          console.error("Error parsing stored user data:", error)
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user")
        }
      }

      // Check for admin token in cookies
      const adminToken = getCookie("admin_token")
      if (adminToken) {
        // Verify admin token with server
        verifyAdminToken(adminToken)
      } else {
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
      if (user) {
        localStorage.setItem("user", JSON.stringify(user))
      } else {
        localStorage.removeItem("user")
      }

      if (accessToken) {
        localStorage.setItem("auth_token", accessToken)
      } else {
        localStorage.removeItem("auth_token")
      }
    }
  }, [user, accessToken])

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