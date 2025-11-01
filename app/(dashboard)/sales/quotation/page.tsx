"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Edit, Trash2, Plus, FileText, Send, Copy, Download, Printer } from "lucide-react"
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
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils"
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
import { useGetQuotationsQuery, useDeleteQuotationMutation } from "@/redux/Service/quotation"

interface QuotationItem {
  id: string
  description: string
  quantity: number
  unit_price: string
  tax_percent: string
  total: string
  plan_type: string
  delivery_days: number
  quotation: string
}

interface Quotation {
  id: string
  quotation_number: string
  date: string
  valid_until: string
  project: string
  place_of_supply: string
  design_scope: string
  delivery_location: string
  revision_rounds: number
  notes: string
  terms_and_conditions: string
  customer: string
  vessel: string
  items: QuotationItem[]
}

interface QuotationStats {
  totalQuotations: number
  draftQuotations: number
  sentQuotations: number
  acceptedQuotations: number
  rejectedQuotations: number
  expiredQuotations: number
  totalValue: number
  acceptedValue: number
}

export default function QuotationPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // RTK Query hooks
  const { data: quotations = [], isLoading, error } = useGetQuotationsQuery()
  const [deleteQuotation] = useDeleteQuotationMutation()

  const [stats, setStats] = useState<QuotationStats>({
    totalQuotations: 0,
    draftQuotations: 0,
    sentQuotations: 0,
    acceptedQuotations: 0,
    rejectedQuotations: 0,
    expiredQuotations: 0,
    totalValue: 0,
    acceptedValue: 0,
  })

  // Calculate stats from quotations data
  useEffect(() => {
    if (quotations && quotations.length > 0) {
      const totalQuotations = quotations.length
      let totalValue = 0
      let acceptedValue = 0

      quotations.forEach(quotation => {
        const quotationTotal = quotation.items.reduce((sum, item) => sum + parseFloat(item.total), 0)
        totalValue += quotationTotal
      })

      setStats({
        totalQuotations,
        draftQuotations: quotations.filter(q => q.status === "Draft").length,
        sentQuotations: quotations.filter(q => q.status === "Sent").length,
        acceptedQuotations: quotations.filter(q => q.status === "Accepted").length,
        rejectedQuotations: quotations.filter(q => q.status === "Rejected").length,
        expiredQuotations: quotations.filter(q => q.status === "Expired").length,
        totalValue,
        acceptedValue,
      })
    }
  }, [quotations])

  // Handle errors from RTK Query
  useEffect(() => {
    if (error) {
      console.error("Error fetching quotations:", error)
      toast({
        title: "Error",
        description: "Failed to load quotations",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleDelete = async (id: string, quotationNumber: string) => {
    try {
      await deleteQuotation(id).unwrap()
      
      toast({
        title: "Success",
        description: `Quotation ${quotationNumber} has been deleted successfully`,
      })
    } catch (error) {
      console.error("Error deleting quotation:", error)
      toast({
        title: "Error",
        description: "Failed to delete quotation",
        variant: "destructive",
      })
    }
    finally {
    // Manually close any lingering dialogs or overlays
    document.body.style.pointerEvents = "auto"; // unlocks UI
    document.body.style.overflow = "auto";      // re-enables scrolling
  }
  }

  const getQuotationTotal = (quotation: Quotation) => {
    return quotation.items.reduce((sum, item) => sum + parseFloat(item.total), 0)
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Draft": "bg-gray-100 text-gray-800",
      "Sent": "bg-blue-100 text-blue-800",
      "Accepted": "bg-green-100 text-green-800",
      "Rejected": "bg-red-100 text-red-800",
      "Expired": "bg-orange-100 text-orange-800",
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const columns: ColumnDef<Quotation>[] = [
    {
      accessorKey: "quotation_number",
      header: "Quotation Number",
      cell: ({ row }) => <div className="font-medium">{row.getValue("quotation_number")}</div>,
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => {
        const project = row.getValue("project") as string
        return (
          <div className="max-w-[200px] truncate">
            {project || "No project name"}
          </div>
        )
      },
    },
    {
      accessorKey: "customer",
      header: "Customer ID",
      cell: ({ row }) => {
        const customerId = row.getValue("customer") as string
        return <div className="text-sm text-muted-foreground">{customerId.slice(0, 8)}...</div>
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.getValue("date")),
    },
    {
      accessorKey: "valid_until",
      header: "Valid Until",
      cell: ({ row }) => formatDate(row.getValue("valid_until")),
    },
    {
      accessorKey: "items",
      header: "Total Amount",
      cell: ({ row }) => {
        const quotation = row.original
        const total = getQuotationTotal(quotation)
        return formatCurrency(total)
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return getStatusBadge(status)
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const quotation = row.original

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
              <DropdownMenuItem onClick={() => router.push(`/sales/quotation/${quotation.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/sales/quotation/${quotation.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/sales/quotation/${quotation.id}/preview`)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/api/sales/quotation/${quotation.id}/pdf`, "_blank")}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete quotation {quotation.quotation_number} and all associated data. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(quotation.id, quotation.quotation_number)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "Sales", href: "/sales" }, { label: "Quotations" }]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="Manage your quotations and track customer responses"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/sales/quotation/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quotation
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotations}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.totalValue)} total value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draftQuotations}</div>
            <p className="text-xs text-muted-foreground">Pending completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sentQuotations}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.acceptedQuotations}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats.acceptedValue)} won</p>
          </CardContent>
        </Card>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={quotations}
        searchKey="quotation_number"
        searchPlaceholder="Search quotations..."
        onAdd={() => router.push("/sales/quotation/new")}
        addLabel="Create Quotation"
        loading={isLoading}
      />
    </div>
  )
}