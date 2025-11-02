"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Edit, Trash2, Plus, FileText, Truck } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeliveryChallan {
  id: string
  challanNumber: string
  date: string
  customer: {
    firstName: string
    lastName: string
    companyName: string | null
  }
}

interface DeliveryChallanStats {
  totalChallans: number
  thisMonthChallans: number
  pendingChallans: number
  deliveredChallans: number
}

export default function DeliveryChallansPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [challans, setChallans] = useState<DeliveryChallan[]>([])
  const [stats, setStats] = useState<DeliveryChallanStats>({
    totalChallans: 0,
    thisMonthChallans: 0,
    pendingChallans: 0,
    deliveredChallans: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallans()
    fetchStats()
  }, [])

  const fetchChallans = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/sales/deliverychallan")
      if (!response.ok) throw new Error("Failed to fetch delivery challans")
      const data = await response.json()
      setChallans(data)
    } catch (error) {
      console.error("Error fetching delivery challans:", error)
      toast({
        title: "Error",
        description: "Failed to load delivery challans",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/sales/deliverychallan/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching delivery challan stats:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/sales/deliverychallan/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete delivery challan")
      }

      toast({
        title: "Success",
        description: "Delivery challan deleted successfully",
      })

      fetchChallans()
      fetchStats()
    } catch (error) {
      console.error("Error deleting delivery challan:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete delivery challan",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const columns: ColumnDef<DeliveryChallan>[] = [
    {
      accessorKey: "challanNumber",
      header: "Challan #",
      cell: ({ row }) => <div className="font-medium">{row.getValue("challanNumber")}</div>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.getValue("date")),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.getValue("customer") as DeliveryChallan["customer"]
        return customer.companyName || `${customer.firstName} ${customer.lastName}`
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const challan = row.original

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
              <DropdownMenuItem onClick={() => router.push(`/sales/deliverychallan/${challan.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/sales/deliverychallan/${challan.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the delivery challan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(challan.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "Sales", href: "/sales" }, { label: "Delivery Challans" }]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Challans"
        description="Manage delivery challans and track shipments"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/sales/deliverychallan/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Delivery Challan
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Challans</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChallans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonthChallans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingChallans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.deliveredChallans}</div>
          </CardContent>
        </Card>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={challans}
        searchKey="challanNumber"
        searchPlaceholder="Search delivery challans..."
        onAdd={() => router.push("/sales/deliverychallan/new")}
        addLabel="Create Delivery Challan"
        loading={loading}
      />
    </div>
  )
}

