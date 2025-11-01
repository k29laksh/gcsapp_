"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Edit, Trash2, Plus, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
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
import { useGetInquiriesQuery, useDeleteInquiryMutation } from "@/redux/Service/inquiry"

interface Inquiry {
  id: string
  date: string
  subject: string
  requirements: string
  source: string
  status: string
  budget: number
  timeline: string
  follow_up_date: string
  notes: string
  assigned_to: string
}

interface InquiryStats {
  totalInquiries: number
  pendingInquiries: number
  inProgressInquiries: number
  completedInquiries: number
  cancelledInquiries: number
}

export default function InquiryPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // RTK Query hooks
  const { data: inquiries = [], isLoading, error } = useGetInquiriesQuery()
  const [deleteInquiry] = useDeleteInquiryMutation()

  const [stats, setStats] = useState<InquiryStats>({
    totalInquiries: 0,
    pendingInquiries: 0,
    inProgressInquiries: 0,
    completedInquiries: 0,
    cancelledInquiries: 0,
  })

  // Calculate stats from inquiries data
  useEffect(() => {
    if (inquiries && inquiries.length > 0) {
      const totalInquiries = inquiries.length
      const pendingInquiries = inquiries.filter(inquiry => inquiry.status === "Pending").length
      const inProgressInquiries = inquiries.filter(inquiry => inquiry.status === "In Progress").length
      const completedInquiries = inquiries.filter(inquiry => inquiry.status === "Completed").length
      const cancelledInquiries = inquiries.filter(inquiry => inquiry.status === "Cancelled").length

      setStats({
        totalInquiries,
        pendingInquiries,
        inProgressInquiries,
        completedInquiries,
        cancelledInquiries,
      })
    } else {
      setStats({
        totalInquiries: 0,
        pendingInquiries: 0,
        inProgressInquiries: 0,
        completedInquiries: 0,
        cancelledInquiries: 0,
      })
    }
  }, [inquiries])

  // Handle errors from RTK Query
  useEffect(() => {
    if (error) {
      console.error("Error fetching inquiries:", error)
      toast({
        title: "Error",
        description: "Failed to load inquiries",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleDelete = async (id: string) => {
  try {
    await deleteInquiry(id).unwrap();

    toast({
      title: "Success",
      description: "Inquiry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    toast({
      title: "Error",
      description: "Failed to delete inquiry",
      variant: "destructive",
    });
  } finally {
    // Manually close any lingering dialogs or overlays
    document.body.style.pointerEvents = "auto"; // unlocks UI
    document.body.style.overflow = "auto";      // re-enables scrolling
  }
};


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Pending": "bg-yellow-100 text-yellow-800",
      "In Progress": "bg-blue-100 text-blue-800",
      "Completed": "bg-green-100 text-green-800",
      "Cancelled": "bg-red-100 text-red-800",
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const getSourceBadge = (source: string) => {
    const sourceColors = {
      "Email": "bg-blue-100 text-blue-800",
      "Phone": "bg-green-100 text-green-800",
      "Website": "bg-purple-100 text-purple-800",
      "Referral": "bg-orange-100 text-orange-800",
    }
    return (
      <Badge variant="outline" className={sourceColors[source as keyof typeof sourceColors] || "bg-gray-100 text-gray-800"}>
        {source}
      </Badge>
    )
  }

  const columns: ColumnDef<Inquiry>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("id").slice(0, 8)}...</div>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.getValue("date")),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => <div className="max-w-[200px] truncate font-medium">{row.getValue("subject")}</div>,
    },
    {
      accessorKey: "requirements",
      header: "Requirements",
      cell: ({ row }) => (
        <div className="max-w-[250px] truncate text-sm text-muted-foreground">
          {row.getValue("requirements")}
        </div>
      ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => getSourceBadge(row.getValue("source")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "budget",
      header: "Budget",
      cell: ({ row }) => {
        const budget = row.getValue("budget") as number
        return budget ? formatCurrency(budget) : "Not specified"
      },
    },
    {
      accessorKey: "timeline",
      header: "Timeline",
      cell: ({ row }) => row.getValue("timeline") || "Not specified",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const inquiry = row.original

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
              <DropdownMenuItem onClick={() => router.push(`/sales/inquiry/${inquiry.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/sales/inquiry/${inquiry.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {inquiry.status === "In Progress" && (
                <DropdownMenuItem onClick={() => router.push(`/sales/quotation/new?inquiryId=${inquiry.id}`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Quotation
                </DropdownMenuItem>
              )}
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
                      This action cannot be undone. This will permanently delete the inquiry.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(inquiry.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "Sales", href: "/sales" }, { label: "Inquiries" }]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Inquiries"
        description="Manage customer inquiries and track conversion"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/sales/inquiry/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Inquiry
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInquiries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingInquiries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressInquiries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedInquiries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelledInquiries}</div>
          </CardContent>
        </Card>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={inquiries}
        searchKey="subject"
        searchPlaceholder="Search inquiries by subject..."
        onAdd={() => router.push("/sales/inquiry/new")}
        addLabel="New Inquiry"
        loading={isLoading}
      />
    </div>
  )
}