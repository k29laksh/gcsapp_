"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Edit, Trash2, Plus, Building, Users, TrendingUp, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { DataTableEnhanced } from "@/components/ui/data-table-enhanced"
import { PageHeader } from "@/components/ui/page-header"

interface Vendor {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  city: string | null
  country: string | null
  _count?: {
    purchaseOrders: number
    bills: number
  }
}

interface VendorStats {
  totalVendors: number
  activeVendors: number
  newThisMonth: number
  totalPurchaseOrders: number
  totalSpend: number
  avgOrderValue: number
}

export default function VendorsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<VendorStats>({
    totalVendors: 0,
    activeVendors: 0,
    newThisMonth: 0,
    totalPurchaseOrders: 0,
    totalSpend: 0,
    avgOrderValue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendors()
    fetchStats()
  }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/purchase/vendor")
      if (!response.ok) throw new Error("Failed to fetch vendors")
      const data = await response.json()
      setVendors(data)
    } catch (error) {
      console.error("Error fetching vendors:", error)
      toast({
        title: "Error",
        description: "Failed to load vendors",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/purchase/vendor/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching vendor stats:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return

    try {
      const response = await fetch(`/api/purchase/vendor/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete vendor")

      setVendors(vendors.filter((vendor) => vendor.id !== id))

      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      })

      fetchStats()
    } catch (error) {
      console.error("Error deleting vendor:", error)
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: "name",
      header: "Vendor Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "contactName",
      header: "Contact Person",
      cell: ({ row }) => row.getValue("contactName") || "N/A",
    },
    {
      accessorKey: "contact",
      header: "Contact Info",
      cell: ({ row }) => {
        const vendor = row.original
        return (
          <div>
            {vendor.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">{vendor.phone}</span>
              </div>
            )}
            {vendor.email && <div className="text-sm text-muted-foreground">{vendor.email}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => {
        const vendor = row.original
        if (!vendor.city && !vendor.country) return "N/A"
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{[vendor.city, vendor.country].filter(Boolean).join(", ")}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "purchaseOrders",
      header: "Purchase Orders",
      cell: ({ row }) => {
        const count = row.original._count?.purchaseOrders || 0
        return <span className="font-medium">{count}</span>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const vendor = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/purchase/vendor/${vendor.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/purchase/vendor/${vendor.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(vendor.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "Purchase", href: "/purchase" }, { label: "Vendors" }]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Manage your vendor database and supplier relationships"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/purchase/vendor/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
            <p className="text-xs text-muted-foreground">Registered suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVendors}</div>
            <p className="text-xs text-muted-foreground">With recent orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground">Recently added vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchaseOrders}</div>
            <p className="text-xs text-muted-foreground">Purchase orders placed</p>
          </CardContent>
        </Card>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={vendors}
        searchKey="name"
        searchPlaceholder="Search vendors..."
        onAdd={() => router.push("/purchase/vendor/new")}
        addLabel="Add Vendor"
        loading={loading}
      />
    </div>
  )
}

