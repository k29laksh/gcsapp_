"use client"

import { DataTable } from "@/components/ui/data-table"
import { Eye, Edit, Trash2 } from "lucide-react"
import { useGetDeliveryChallansQuery, useDeleteDeliveryChallanMutation } from "@/redux/Service/delivery-challan"
import { useToast } from "@/hooks/use-toast"

interface DeliveryChallanItem {
  id: string
  delivery_note_no: string
  order_no: string
  dispatch_date: string
  delivery_method: string
  customer?: {
    name: string
  }
  invoice?: {
    invoice_no: string
  }
}

export default function DeliveryChallansList() {
  const { toast } = useToast()
  
  // Fetch delivery challans
  const { data: challans, isLoading } = useGetDeliveryChallansQuery({})
  const [deleteDeliveryChallan] = useDeleteDeliveryChallanMutation()
  
  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const columns = [
    {
      key: "delivery_note_no",
      label: "Delivery Note No.",
      sortable: true,
      className: "min-w-[150px]",
      mobilePriority: true,
    },
    {
      key: "customer",
      label: "Customer",
      sortable: true,
      render: (value: { company_name: string }) => value?.company_name || "N/A",
      className: "min-w-[150px]",
    },
    {
      key: "invoice",
      label: "Invoice No.",
      sortable: true,
      render: (value: { invoice_no: string }) => value?.invoice_no || "N/A",
      className: "min-w-[120px]",
    },
    {
      key: "order_no",
      label: "Order No.",
      sortable: true,
      className: "min-w-[100px]",
    },
    {
      key: "dispatch_date",
      label: "Dispatch Date",
      sortable: true,
      render: (value: string) => formatDate(value),
      className: "min-w-[110px]",
    },
    {
      key: "delivery_method",
      label: "Delivery Method",
      sortable: true,
      className: "min-w-[130px]",
    },
  ]

  const actions = [
    {
      type: "view" as const,
      label: "View Details",
      icon: <Eye className="h-4 w-4 mr-2" />,
      href: (item: { id: string }) => `/sales/deliverychallan/${item.id}`,
    },
    {
      type: "edit" as const,
      label: "Edit",
      icon: <Edit className="h-4 w-4 mr-2" />,
      href: (item: { id: string }) => `/sales/deliverychallan/${item.id}/edit`,
    },
    {
      type: "delete" as const,
      label: "Delete",
      icon: <Trash2 className="h-4 w-4 mr-2" />,
      onClick: async (item: { id: string }, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (confirm("Are you sure you want to delete this delivery challan?")) {
          await handleDelete(item.id)
        }
      },
    },
  ]

  const filters = [
    {
      key: "delivery_method",
      label: "Delivery Method",
      type: "select" as const,
      options: [
        { value: "Air Freight", label: "Air Freight" },
        { value: "Sea Freight", label: "Sea Freight" },
        { value: "Road Transport", label: "Road Transport" },
        { value: "Courier", label: "Courier" },
      ],
    },
  ]

  const handleDelete = async (id: string) => {
    try {
      await deleteDeliveryChallan(id).unwrap()
      toast({
        title: "Success",
        description: "Delivery Challan deleted successfully",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete delivery challan",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading delivery challans...</div>
      </div>
    )
  }

  return (
    <DataTable
      data={challans || []}
      columns={columns}
      actions={actions}
      filters={filters}
      searchable={true}
      sortable={true}
      createButton={{
        label: "New Delivery Challan",
        href: "/sales/deliverychallan/new",
      }}
      title="Delivery Challans"
      description="Manage and track delivery challans"
      onDelete={handleDelete}
      emptyMessage="No delivery challans found"
      renderMobileCard={(item: DeliveryChallanItem) => (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-2">
              <div>
                <p className="font-semibold text-gray-900">{item.delivery_note_no}</p>
                <p className="text-xs text-gray-600">{item.customer?.name || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1 mb-3">
            <p>Order: {item.order_no}</p>
            <p>Invoice: {item.invoice?.invoice_no || "N/A"}</p>
            <p>Dispatch: {formatDate(item.dispatch_date)}</p>
            <p>Method: {item.delivery_method}</p>
          </div>
        </div>
      )}
    />
  )
}