"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Eye, Pencil, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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
import type { ColumnDef } from "@tanstack/react-table"

interface VendorPayment {
  id: string
  date: string
  vendor: {
    name: string
  }
  amount: number
  reference: string | null
  method: "CASH" | "BANK_TRANSFER" | "CHECK" | "CREDIT_CARD" | "ONLINE" | "OTHER"
}

export default function VendorPaymentsPage() {
  const [payments, setPayments] = useState<VendorPayment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [filter, setFilter] = useState({
    search: "",
    dateRange: { from: null, to: null } as { from: Date | null; to: null },
    sortBy: "date",
    sortOrder: "desc" as "asc" | "desc",
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/purchase/payment")
      if (!response.ok) throw new Error("Failed to fetch vendor payments")
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error("Error fetching vendor payments:", error)
      toast({
        title: "Error",
        description: "Failed to load vendor payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/purchase/sales/payment/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete vendor payment")

      setPayments(payments.filter((payment) => payment.id !== id))

      toast({
        title: "Success",
        description: "Vendor payment deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting vendor payment:", error)
      toast({
        title: "Error",
        description: "Failed to delete vendor payment",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      window.location.href = "/api/excel?type=vendorpayments"
    } catch (error) {
      console.error("Error exporting vendor payments:", error)
      toast({
        title: "Error",
        description: "Failed to export vendor payments",
        variant: "destructive",
      })
    }
  }

  const handleImport = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/excel", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to import vendor payments")

      toast({
        title: "Success",
        description: "Vendor payments imported successfully",
      })

      fetchPayments()
    } catch (error) {
      console.error("Error importing vendor payments:", error)
      toast({
        title: "Error",
        description: "Failed to import vendor payments",
        variant: "destructive",
      })
    }
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

  const columns: ColumnDef<VendorPayment>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        return new Date(row.original.date).toLocaleDateString()
      },
    },
    {
      accessorKey: "vendor.name",
      header: "Vendor",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        return `$${row.original.amount.toFixed(2)}`
      },
    },
    {
      accessorKey: "method",
      header: "Payment Method",
      cell: ({ row }) => {
        return getPaymentMethodLabel(row.original.method)
      },
    },
    {
      accessorKey: "reference",
      header: "Reference",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/purchase/sales/payment/${payment.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/purchase/sales/payment/${payment.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete this payment record.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(payment.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Vendor Payments</h2>
        <Button asChild>
          <Link href="/purchase/sales/payment/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={payments}
        searchKey="vendor.name"
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  )
}

