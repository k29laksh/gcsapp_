"use client"

import { useState, useEffect, useCallback } from "react"

type NotificationType = "info" | "warning" | "error" | "success"

interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  date: string
  read: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")

      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }

      const data = await response.json()
      setNotifications(data)
      setUnreadCount(data.filter((notification: Notification) => !notification.read).length)
    } catch (err) {
      console.error("Error fetching notifications:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      // Provide mock data in case of error
      const mockNotifications = [
        {
          id: "1",
          title: "New Invoice",
          message: "Invoice #INV-2023-001 has been created",
          type: "info" as NotificationType,
          date: new Date().toISOString(),
          read: false,
        },
        {
          id: "2",
          title: "Payment Received",
          message: "Payment of ₹25,000 received from Customer A",
          type: "success" as NotificationType,
          date: new Date(Date.now() - 3600000).toISOString(),
          read: true,
        },
        {
          id: "3",
          title: "Overdue Invoice",
          message: "Invoice #INV-2023-002 is overdue by 5 days",
          type: "warning" as NotificationType,
          date: new Date(Date.now() - 7200000).toISOString(),
          read: false,
        },
      ]
      setNotifications(mockNotifications)
      setUnreadCount(mockNotifications.filter((notification) => !notification.read).length)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Set up polling for new notifications
    const intervalId = setInterval(fetchNotifications, 60000) // Poll every minute

    return () => clearInterval(intervalId)
  }, [fetchNotifications])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }

      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Error marking notification as read:", err)
      // Optimistically update UI even if API fails
      setNotifications((prev) =>
        prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read")
      }

      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
      // Optimistically update UI even if API fails
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
      setUnreadCount(0)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}
