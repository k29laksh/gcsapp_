"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Edit, Trash2, Plus, DollarSign, CreditCard, Banknote } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
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

interface CustomerPayment {
  id: string
  date: string
  customer: {
    firstName: string
    lastName: string
    companyName: string | null
  }
  amount: number
  reference: string | null
  method: "CASH" | "BANK_TRANSFER" | "CHECK" | "CREDIT_CARD" | "ONLINE" | "OTHER"
}

interface PaymentStats {
  totalPayments: number
  thisMonthPayments: number
  totalAmount: number
  thisMonthAmount: number
}

export default function CustomerPaymentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [payments, setPayments] = useState<CustomerPayment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    thisMonthPayments: 0,
    totalAmount: 0,
    thisMonthAmount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
    fetchStats()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/sales/payment")
      if (!response.ok) throw new Error("Failed to fetch customer payments")
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error("Error fetching customer payments:", error)
      toast({
        title: "Error",
        description: "Failed to load customer payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/sales/payment/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching payment stats:", error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/sales/payment/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete customer payment")
      }

      toast({
        title: "Success",
        description: "Customer payment deleted successfully",
      })

      fetchPayments()
      fetchStats()
    } catch (error) {
      console.error("Error deleting customer payment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer payment",
        variant: "destructive",
      })
    }
    finally {
    // Manually close any lingering dialogs or overlays
    document.body.style.pointerEvents = "auto"; // unlocks UI
    document.body.style.overflow = "auto";      // re-enables scrolling
  }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "CASH":
        return "Cash"
      case "BANK_TRANSFER":
        return "Bank Transfer"
      case "CHECK":
        return "Check"
      case "CREDIT_CARD":
        return "Credit Card"
      case "ONLINE":
        return "Online"
      case "OTHER":
        return "Other"
      default:
        return method
    }
  }

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      CASH: "bg-green-100 text-green-800",
      BANK_TRANSFER: "bg-blue-100 text-blue-800",
      CHECK: "bg-yellow-100 text-yellow-800",
      CREDIT_CARD: "bg-purple-100 text-purple-800",
      ONLINE: "bg-indigo-100 text-indigo-800",
      OTHER: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge className={colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {getPaymentMethodLabel(method)}
      </Badge>
    )
  }

  const columns: ColumnDef<CustomerPayment>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.getValue("date")),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.getValue("customer") as CustomerPayment["customer"]
        return customer.companyName || `${customer.firstName} ${customer.lastName}`
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.getValue("amount")),
    },
    {
      accessorKey: "method",
      header: "Payment Method",
      cell: ({ row }) => getPaymentMethodBadge(row.getValue("method")),
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => {
        const reference = row.getValue("reference") as string
        return reference || "-"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original

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
              <DropdownMenuItem onClick={() => router.push(`/sales/payment/${payment.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/sales/payment/${payment.id}/edit`)}>
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
                      This action cannot be undone. This will permanently delete the payment record.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(payment.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "Sales", href: "/sales" }, { label: "Customer Payments" }]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Payments"
        description="Manage customer payments and track collections"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/sales/payment/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Banknote className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonthPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.thisMonthAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={payments}
        searchKey="customer.firstName"
        searchPlaceholder="Search payments..."
        onAdd={() => router.push("/sales/payment/new")}
        addLabel="Add Payment"
        loading={loading}
      />
    </div>
  )
}
