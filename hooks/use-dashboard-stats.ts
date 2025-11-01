"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

// Define the stats type
interface DashboardStats {
  totalCustomers: number
  totalVendors: number
  totalProjects: number
  totalEmployees: number
  totalInvoices: number
  totalPurchaseOrders: number
  revenueThisMonth: number
  expensesThisMonth: number
  [key: string]: any
}

// Initial empty stats
const initialStats: DashboardStats = {
  totalCustomers: 0,
  totalVendors: 0,
  totalProjects: 0,
  totalEmployees: 0,
  totalInvoices: 0,
  totalPurchaseOrders: 0,
  revenueThisMonth: 0,
  expensesThisMonth: 0,
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/dashboard/stats")

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching dashboard stats:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refreshStats: fetchDashboardStats,
  }
}
