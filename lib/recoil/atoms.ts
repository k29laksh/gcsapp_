import { atom } from "recoil"
import type { User } from "next-auth"

// Auth state
export const userState = atom<User | null>({
  key: "userState",
  default: null,
})

// UI state
export const sidebarOpenState = atom<boolean>({
  key: "sidebarOpenState",
  default: true,
})

export const themeState = atom<"light" | "dark" | "system">({
  key: "themeState",
  default: "system",
})

// Dashboard state
export const dashboardStatsState = atom<{
  totalRevenue: number
  totalCustomers: number
  totalPurchaseOrders: number
  totalInvoices: number
  revenueGrowth: number
  customerGrowth: number
  poGrowth: number
  invoiceGrowth: number
}>({
  key: "dashboardStatsState",
  default: {
    totalRevenue: 0,
    totalCustomers: 0,
    totalPurchaseOrders: 0,
    totalInvoices: 0,
    revenueGrowth: 0,
    customerGrowth: 0,
    poGrowth: 0,
    invoiceGrowth: 0,
  },
})

// Notification state
export const notificationsState = atom<
  {
    id: string
    title: string
    message: string
    read: boolean
    date: Date
    type: "info" | "warning" | "error" | "success"
  }[]
>({
  key: "notificationsState",
  default: [],
})

// Filter states for various entities
export const vendorFilterState = atom<{
  search: string
  sortBy: string
  sortOrder: "asc" | "desc"
}>({
  key: "vendorFilterState",
  default: {
    search: "",
    sortBy: "name",
    sortOrder: "asc",
  },
})

export const customerFilterState = atom<{
  search: string
  sortBy: string
  sortOrder: "asc" | "desc"
}>({
  key: "customerFilterState",
  default: {
    search: "",
    sortBy: "firstName",
    sortOrder: "asc",
  },
})

export const invoiceFilterState = atom<{
  search: string
  status: string[]
  dateRange: { from: Date | null; to: Date | null }
  sortBy: string
  sortOrder: "asc" | "desc"
}>({
  key: "invoiceFilterState",
  default: {
    search: "",
    status: [],
    dateRange: { from: null, to: null },
    sortBy: "date",
    sortOrder: "desc",
  },
})

export const quotationFilterState = atom<{
  search: string
  status: string[]
  dateRange: { from: Date | null; to: Date | null }
  sortBy: string
  sortOrder: "asc" | "desc"
}>({
  key: "quotationFilterState",
  default: {
    search: "",
    status: [],
    dateRange: { from: null, to: null },
    sortBy: "date",
    sortOrder: "desc",
  },
})

export const purchaseOrderFilterState = atom<{
  search: string
  status: string[]
  dateRange: { from: Date | null; to: Date | null }
  sortBy: string
  sortOrder: "asc" | "desc"
}>({
  key: "purchaseOrderFilterState",
  default: {
    search: "",
    status: [],
    dateRange: { from: null, to: null },
    sortBy: "date",
    sortOrder: "desc",
  },
})
