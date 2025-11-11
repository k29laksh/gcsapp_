"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Edit, Trash2, Plus, FileText, DollarSign } from "lucide-react"
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
import {
  useGetCreditNotesQuery,
  useGetCreditNoteStatsQuery,
  useDeleteCreditNoteMutation,
} from "@/redux/Service/credit-notes"

interface Customer {
  id: string
  firstName: string
  lastName: string
  companyName: string | null
}

interface CreditNoteWithCustomer {
  id: string
  note_number: number
  date: string
  reference: string
  reason: string
  notes: string
  customer: string
  customer_details?: Customer
}

export default function CreditNotesPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // RTK Query hooks
  const { 
    data: creditNotesData, 
    isLoading: notesLoading, 
    error: notesError,
    refetch: refetchCreditNotes 
  } = useGetCreditNotesQuery()
  
  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useGetCreditNoteStatsQuery()
  
  const [deleteCreditNote] = useDeleteCreditNoteMutation()

  // Transform API data to include customer details (you'll need to fetch customers separately)
  const [creditNotes, setCreditNotes] = useState<CreditNoteWithCustomer[]>([])

  useEffect(() => {
    if (creditNotesData) {
      // If your API doesn't return customer details, you'll need to fetch them separately
      // This is a placeholder - you'll need to implement customer data fetching
      const notesWithCustomers = creditNotesData.map((note: any) => ({
        ...note,
        customer_details: {
          id: note.customer,
          firstName: "Loading...", // You'll need to fetch this from customers API
          lastName: "",
          companyName: null
        }
      }))
      setCreditNotes(notesWithCustomers)
    }
  }, [creditNotesData])

  useEffect(() => {
    if (notesError) {
      toast({
        title: "Error",
        description: "Failed to load credit notes",
        variant: "destructive",
      })
    }
  }, [notesError, toast])

  const handleDelete = async (id: string) => {
    try {
      await deleteCreditNote(id).unwrap()
      
      toast({
        title: "Success",
        description: "Credit note deleted successfully",
      })

      refetchCreditNotes()
    } catch (error) {
      console.error("Error deleting credit note:", error)
      toast({
        title: "Error",
        description: "Failed to delete credit note",
        variant: "destructive",
      })
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

  const getCustomerName = (creditNote: CreditNoteWithCustomer) => {
    
    return creditNote.customer
  }

  const columns: ColumnDef<CreditNoteWithCustomer>[] = [
    {
      accessorKey: "note_number",
      header: "Credit Note #",
      cell: ({ row }) => <div className="font-medium">CN-{row.getValue("note_number")}</div>,
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
        const creditNote = row.original
        return getCustomerName(creditNote)
      },
    },
    {
      accessorKey: "reference",
      header: "Reference",
      cell: ({ row }) => <div>{row.getValue("reference") || "N/A"}</div>,
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue("reason")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const creditNote = row.original

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
              <DropdownMenuItem onClick={() => router.push(`/sales/creditnote/${creditNote.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/sales/creditnote/${creditNote.id}/edit`)}>
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
                      This action cannot be undone. This will permanently delete the credit note.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(creditNote.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const breadcrumbs = [{ label: "Sales", href: "/sales" }, { label: "Credit Notes" }]

  // Stats data from RTK Query
  const stats = statsData || {
    totalCreditNotes: 0,
    thisMonthCreditNotes: 0,
    totalAmount: 0,
    thisMonthAmount: 0,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Notes"
        description="Manage credit notes and customer refunds"
        breadcrumbs={breadcrumbs}
        action={
          <Button onClick={() => router.push("/sales/creditnote/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Credit Note
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Notes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreditNotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.thisMonthCreditNotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.thisMonthAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <DataTableEnhanced
        columns={columns}
        data={creditNotes}
        searchKey="note_number"
        searchPlaceholder="Search credit notes..."
        onAdd={() => router.push("/sales/creditnote/new")}
        addLabel="Add Credit Note"
        loading={notesLoading}
      />
    </div>
  )
}