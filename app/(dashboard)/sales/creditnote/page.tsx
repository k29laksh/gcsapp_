"use client"

import { DataTable } from "@/components/ui/data-table"
import { formatDate } from "@/lib/dummy-data"
import { Eye, Edit, Trash2 } from "lucide-react"
import { useGetCreditNotesQuery, useDeleteCreditNoteMutation } from "@/redux/Service/credit-notes"
import { useToast } from "@/hooks/use-toast"

export default function CreditNoteListPage() {
  const { data: creditNotes = [], isLoading } = useGetCreditNotesQuery({})
  const [deleteCreditNote] = useDeleteCreditNoteMutation()
  const { toast } = useToast()

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this credit note?")) {
      try {
        await deleteCreditNote(id).unwrap()
        toast({
          title: "Success",
          description: "Credit note deleted successfully",
        })
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete credit note",
          variant: "destructive",
        })
      }
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      issued: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const columns = [
    {
      key: "note_no",
      label: "Credit Note No.",
      sortable: true,
      mobilePriority: true,
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (value: any) => value?.company_name || value?.customer_type || "N/A",
    },
    {
      key: "contact_person",
      label: "Contact Person",
      sortable: true,
    },
    {
      key: "invoice",
      label: "Invoice Ref.",
      sortable: true,
      render: (value: any) => value?.invoice_no || "N/A",
    },
    {
      key: "items",
      label: "Amount",
      sortable: false,
      render: (items: any[]) => {
        const total = items?.reduce((sum, item) => {
          return sum + (Number.parseFloat(item.rate) * item.quantity)
        }, 0) || 0
        return `₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      },
      className: "text-right",
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (value: string) => formatDate(value),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
  ]

  const actions = [
    {
      type: "view" as const,
      label: "View Details",
      icon: <Eye className="h-4 w-4 mr-2" />,
      href: (item: any) => `/sales/creditnote/${item.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      href: (item: any) => `/sales/creditnote/${item.id}/edit`,
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: (item: any, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleDelete(item.id)
      },
    },
  ]

  const filters = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "issued", label: "Issued" },
        { value: "draft", label: "Draft" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading credit notes...</p>
      </div>
    )
  }

  return (
    <DataTable
      data={creditNotes}
      columns={columns}
      actions={actions}
      filters={filters}
      searchable={true}
      sortable={true}
      createButton={{
        label: "New Credit Note",
        href: "/sales/creditnote/new",
      }}
      title="Credit Notes"
      description="Manage and track credit notes"
      emptyMessage="No credit notes found"
      renderMobileCard={(item) => {
        const total = item.items?.reduce((sum: number, lineItem: any) => {
          return sum + (Number.parseFloat(lineItem.rate) * lineItem.quantity)
        }, 0) || 0

        return (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-sm">{item.note_no}</p>
                <p className="text-xs text-gray-600">
                  {item.customer?.company_name || item.customer?.customer_type || "N/A"}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Contact:</span>
                <span className="font-medium">{item.contact_person}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">
                  ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(item.date)}</span>
              </div>
            </div>
          </div>
        )
      }}
    />
  )
}