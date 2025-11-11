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

interface DebitNote {
  id: string
  debitNumber: string
  date: string
  vendor: {
    name: string
  }
  amount: number
  reason: string
}

export default function DebitNotesPage() {
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const [filter, setFilter] = useState({
    search: "",
    dateRange: { from: null, to: null } as { from: Date | null; to: null },
    sortBy: "date",
    sortOrder: "desc" as "asc" | "desc",
  })

  useEffect(() => {
    fetchDebitNotes()
  }, [])

  const fetchDebitNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/purchase/debitnote")
      if (!response.ok) throw new Error("Failed to fetch debit notes")
      const data = await response.json()
      setDebitNotes(data)
    } catch (error) {
      console.error("Error fetching debit notes:", error)
      toast({
        title: "Error",
        description: "Failed to load debit notes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/purchase/debitnote/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete debit note")

      setDebitNotes(debitNotes.filter((debitNote) => debitNote.id !== id))

      toast({
        title: "Success",
        description: "Debit note deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting debit note:", error)
      toast({
        title: "Error",
        description: "Failed to delete debit note",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      window.location.href = "/api/excel?type=debitnotes"
    } catch (error) {
      console.error("Error exporting debit notes:", error)
      toast({
        title: "Error",
        description: "Failed to export debit notes",
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

      if (!response.ok) throw new Error("Failed to import debit notes")

      toast({
        title: "Success",
        description: "Debit notes imported successfully",
      })

      fetchDebitNotes()
    } catch (error) {
      console.error("Error importing debit notes:", error)
      toast({
        title: "Error",
        description: "Failed to import debit notes",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<DebitNote>[] = [
    {
      accessorKey: "debitNumber",
      header: "Debit Note #",
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
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        return `$${row.original.amount.toFixed(2)}`
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const debitNote = row.original

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/purchase/debitnote/${debitNote.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/purchase/debitnote/${debitNote.id}/edit`}>
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
                  <AlertDialogDescription>This will permanently delete this debit note.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(debitNote.id)}>Delete</AlertDialogAction>
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
        <h2 className="text-2xl font-bold">Debit Notes</h2>
        <Button asChild>
          <Link href="/purchase/debitnote/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Debit Note
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={debitNotes}
        searchKey="debitNumber"
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  )
}
