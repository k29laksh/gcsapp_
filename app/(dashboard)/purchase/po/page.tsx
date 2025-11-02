"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import type { ColumnDef } from "@tanstack/react-table"

interface PO {
  id: string
  poNumber: string
  date: string
  vendor: {
    name: string
  }
  subtotal: number
  tax: number
  total: number
  status: "DRAFT" | "SENT" | "RECEIVED" | "CANCELLED"
}

export default function POsPage() {
  const [pos, setPOs] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [filter, setFilter] = useState({
    search: "",
    status: [] as string[],
    dateRange: { from: null, to: null } as { from: Date | null; to: null },
    sortBy: "date",
    sortOrder: "desc" as "asc" | "desc",
  })

  useEffect(() => {
    fetchPOs()
  }, [])

  const fetchPOs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/purchase/po")
      if (!response.ok) throw new Error("Failed to fetch purchase orders")
      const data = await response.json()
      setPOs(data)
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      toast({
        title: "Error",
        description: "Failed to load purchase orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/purchase/po/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete purchase order")

      setPOs(pos.filter((po) => po.id !== id))

      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting purchase order:", error)
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      window.location.href = "/api/excel?type=pos"
    } catch (error) {
      console.error("Error exporting purchase orders:", error)
      toast({
        title: "Error",
        description: "Failed to export purchase orders",
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

      if (!response.ok) throw new Error("Failed to import purchase orders")

      toast({
        title: "Success",
        description: "Purchase orders imported successfully",
      })

      fetchPOs()
    } catch (error) {
      console.error("Error importing purchase orders:", error)
      toast({
        title: "Error",
        description: "Failed to import purchase orders",
        variant: "destructive",
      })
    }
  }

  const generatePDF = async (id: string) => {
    try {
      window.open(`/api/pdf?type=po&id=${id}`, "_blank")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<PO>[] = [
    {
      accessorKey: "poNumber",
      header: "PO Number",
    },
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
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        return `$${row.original.total.toFixed(2)}`
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        let color = ""

        switch (status) {
          case "DRAFT":
            color = "bg-gray-500"
            break
          case "SENT":
            color = "bg-blue-500"
            break
          case "RECEIVED":
            color = "bg-green-500"
            break
          case "CANCELLED":
            color = "bg-red-500"
            break
        }

        return <Badge className={color}>{status}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const po = row.original

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/purchase/po/${po.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/purchase/po/${po.id}/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => generatePDF(po.id)}>
              <FileText className="h-4 w-4" />
              <span className="sr-only">PDF</span>
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
                  <AlertDialogDescription>
                    This will permanently delete the purchase order and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(po.id)}>Delete</AlertDialogAction>
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
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        <Button asChild>
          <Link href="/purchase/po/new">
            <Plus className="mr-2 h-4 w-4" />
            Create PO
          </Link>
        </Button>
      </div>
      <DataTable columns={columns} data={pos} searchKey="poNumber" onExport={handleExport} onImport={handleImport} />
    </div>
  )
}

