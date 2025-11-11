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

interface Expense {
  id: string
  date: string
  vendor: {
    name: string
  }
  category: string
  amount: number
  description: string | null
  reference: string | null
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [filter, setFilter] = useState({
    search: "",
    dateRange: { from: null, to: null } as { from: Date | null; to: null },
    sortBy: "date",
    sortOrder: "desc" as "asc" | "desc",
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/purchase/expense")
      if (!response.ok) throw new Error("Failed to fetch expenses")
      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error("Error fetching expenses:", error)
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/purchase/expense/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete expense")

      setExpenses(expenses.filter((expense) => expense.id !== id))

      toast({
        title: "Success",
        description: "Expense deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      window.location.href = "/api/excel?type=expenses"
    } catch (error) {
      console.error("Error exporting expenses:", error)
      toast({
        title: "Error",
        description: "Failed to export expenses",
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

      if (!response.ok) throw new Error("Failed to import expenses")

      toast({
        title: "Success",
        description: "Expenses imported successfully",
      })

      fetchExpenses()
    } catch (error) {
      console.error("Error importing expenses:", error)
      toast({
        title: "Error",
        description: "Failed to import expenses",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<Expense>[] = [
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
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        return `$${row.original.amount.toFixed(2)}`
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "reference",
      header: "Reference",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const expense = row.original

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/purchase/expenses/${expense.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/purchase/expenses/${expense.id}/edit`}>
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
                  <AlertDialogDescription>This will permanently delete this expense record.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(expense.id)}>Delete</AlertDialogAction>
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
        <h2 className="text-2xl font-bold">Expenses</h2>
        <Button asChild>
          <Link href="/purchase/expenses/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={expenses}
        searchKey="category"
        onExport={handleExport}
        onImport={handleImport}
      />
    </div>
  )
}
